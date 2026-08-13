import { createPrintPdf } from '../adapters/cmyk-jpeg-to-pdf.pdf-lib'
import { inspectPng } from '../adapters/inspect-png.sharp'
import { pngToCmykJpeg } from '../adapters/png-to-cmyk-jpeg.sharp'
import { pngToCmykTiff } from '../adapters/png-to-cmyk-tiff.sharp'
import { DEFAULT_CMYK_ICC_PROFILE } from '../color-profile'
import { readCmykIccProfile, resolveCmykIccProfilePath } from '../color-profile.server'
import type { CmykIccProfile } from '../export-contract'
import {
	findPrintOutputBlocker,
	type PrintExportFormat,
	type PrintPpi,
	pixelsToMillimeters,
} from '../print-policy'

export class PrintExportInputError extends Error {}

/** 검증된 PNG를 CMYK TIFF 또는 mm 단위 PDF로 변환한다. Sharp·pdf-lib I/O는 각 adapter가 소유한다. */
export async function exportPrint({
	colorProfile = DEFAULT_CMYK_ICC_PROFILE,
	format,
	png,
	ppi,
}: {
	colorProfile?: CmykIccProfile
	format: PrintExportFormat
	png: Buffer
	ppi: PrintPpi
}): Promise<Buffer> {
	const image = await inspectPng(png)
	if (
		!image ||
		findPrintOutputBlocker({ enabled: true, height: image.height, width: image.width })
	) {
		throw new PrintExportInputError()
	}
	const icc = resolveCmykIccProfilePath(colorProfile)

	if (format === 'tiff') {
		const tiff = await pngToCmykTiff(png, ppi, icc)
		if (!tiff) throw new PrintExportInputError()
		return tiff
	}

	const cmykJpeg = await pngToCmykJpeg(png, icc)
	if (!cmykJpeg) throw new PrintExportInputError()
	return createPrintPdf({
		cmykJpeg,
		heightMm: pixelsToMillimeters(image.height, ppi),
		iccProfile: await readCmykIccProfile(colorProfile),
		iccProfileName: colorProfile,
		widthMm: pixelsToMillimeters(image.width, ppi),
	})
}
