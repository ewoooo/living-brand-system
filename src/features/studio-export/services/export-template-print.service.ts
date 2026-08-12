import {
	resolveStudioOutputFormats,
	supportsStudioOutput,
} from '@/features/studio-export/studio-output'
import { findPublishedTemplate } from '@/repositories/published-template.payload.repository'
import { projectTemplateRenderModel } from '@/services/project-template-render-model.service'
import { createTemplatePdf } from '../adapters/cmyk-jpeg-to-pdf.pdf-lib'
import { inspectPng } from '../adapters/inspect-png.sharp'
import { pngToCmykJpeg } from '../adapters/png-to-cmyk-jpeg.sharp'
import { pngToCmykTiff } from '../adapters/png-to-cmyk-tiff.sharp'
import { DEFAULT_CMYK_ICC_PROFILE } from '../color-profile'
import { readCmykIccProfile, resolveCmykIccProfilePath } from '../color-profile.server'
import type { CmykIccProfile } from '../export-contract'
import { parsePrintPpi, pixelsToMillimeters, type TemplatePrintFormat } from '../print-policy'

/** 발행 HTML 또는 운영자 PPI 정책이 없어 인쇄 출력을 제공할 수 없음을 route에 알린다. */
export class TemplatePrintUnavailableError extends Error {}

/** 업로드 PNG가 템플릿의 포맷·픽셀 크기 계약과 다름을 route에 알린다. */
export class TemplatePrintInputError extends Error {}

/** 화면이 렌더한 템플릿 버전과 현재 published 버전이 다름을 route에 알린다. */
export class TemplatePrintStaleError extends Error {}

/**
 * 발행 HTML 템플릿의 운영자 PPI 정책을 적용해 CMYK TIFF 또는 mm 단위 CMYK PDF를 만든다.
 * Payload 조회와 Sharp·pdf-lib 변환은 각 repository가 소유한다.
 */
export async function exportTemplatePrint({
	colorProfile = DEFAULT_CMYK_ICC_PROFILE,
	format,
	png,
	templateId,
	templateVersion,
}: {
	colorProfile?: CmykIccProfile
	format: TemplatePrintFormat
	png: Buffer
	templateId: number
	templateVersion: string
}): Promise<Buffer> {
	const template = await findPublishedTemplate(templateId)
	const renderModel = template ? projectTemplateRenderModel(template) : null
	const ppi = parsePrintPpi(template?.printPpi)

	if (!template || !renderModel || !ppi) throw new TemplatePrintUnavailableError()
	const output = {
		formats: resolveStudioOutputFormats(
			['png', 'tiff', 'pdf'] as const,
			template.output?.allowedFormats,
		),
	}
	if (!supportsStudioOutput(output, format)) throw new TemplatePrintUnavailableError()
	if (template.updatedAt !== templateVersion) throw new TemplatePrintStaleError()

	const image = await inspectPng(png)
	if (!image || image.width !== renderModel.width || image.height !== renderModel.height) {
		throw new TemplatePrintInputError()
	}
	const icc = resolveCmykIccProfilePath(colorProfile)

	if (format === 'tiff') {
		const tiff = await pngToCmykTiff(png, ppi, icc)
		if (!tiff) throw new TemplatePrintInputError()
		return tiff
	}

	const cmykJpeg = await pngToCmykJpeg(png, icc)
	if (!cmykJpeg) throw new TemplatePrintInputError()

	return createTemplatePdf({
		cmykJpeg,
		heightMm: pixelsToMillimeters(renderModel.height, ppi),
		iccProfile: await readCmykIccProfile(colorProfile),
		iccProfileName: colorProfile,
		widthMm: pixelsToMillimeters(renderModel.width, ppi),
	})
}
