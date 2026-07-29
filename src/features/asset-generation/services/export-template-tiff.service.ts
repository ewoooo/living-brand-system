import { parsePrintPpi } from '../print-output'
import { findPublishedTemplate } from '../repositories/published-template.payload.repository'
import {
	convertTemplatePngToTiff,
	inspectTemplatePng,
} from '../repositories/template-tiff.sharp.repository'
import { pickHtmlTemplate } from './get-published-template.service'

/** 발행 HTML 또는 운영자 PPI 정책이 없어 TIFF를 제공할 수 없음을 route에 알린다. */
export class TemplateTiffUnavailableError extends Error {}

/** 업로드 PNG가 템플릿의 포맷·픽셀 크기 계약과 다름을 route에 알린다. */
export class TemplateTiffInputError extends Error {}

/** 화면이 렌더한 템플릿 버전과 현재 published 버전이 다름을 route에 알린다. */
export class TemplateTiffStaleError extends Error {}

/**
 * 발행 HTML 템플릿의 운영자 PPI 정책을 적용해 TIFF를 만드는 use case 경계.
 * Payload 조회와 Sharp 이미지 I/O는 각 repository가 소유한다.
 */
export async function exportTemplateTiff({
	png,
	templateId,
	templateVersion,
}: {
	png: Buffer
	templateId: number
	templateVersion: string
}): Promise<Buffer> {
	const template = await findPublishedTemplate(templateId)
	const html = template ? pickHtmlTemplate(template) : null
	const ppi = parsePrintPpi(template?.printPpi)

	if (!html || !ppi) {
		throw new TemplateTiffUnavailableError()
	}
	if (template.updatedAt !== templateVersion) {
		throw new TemplateTiffStaleError()
	}

	const image = await inspectTemplatePng(png)
	if (!image || image.width !== html.width || image.height !== html.height) {
		throw new TemplateTiffInputError()
	}

	const tiff = await convertTemplatePngToTiff(png, ppi)
	if (!tiff) throw new TemplateTiffInputError()
	return tiff
}
