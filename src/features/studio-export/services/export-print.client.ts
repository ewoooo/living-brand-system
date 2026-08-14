'use client'

import type { CmykIccProfile } from '../export-contract'
import { MAX_PRINT_PNG_BYTES, type PrintExportFormat, type PrintPpi } from '../print-policy'

export class PrintExportDownloadError extends Error {}

/** 브라우저 PNG를 공통 서버 인쇄 변환 경계로 전달한다. HTTP I/O는 이 adapter가 소유한다. */
export async function requestPrintExport({
	colorProfile,
	fileName,
	format,
	png,
	ppi,
}: {
	colorProfile: CmykIccProfile
	fileName: string
	format: PrintExportFormat
	png: Blob
	ppi: PrintPpi
}): Promise<Blob> {
	if (png.size > MAX_PRINT_PNG_BYTES) {
		throw new PrintExportDownloadError(
			`렌더된 PNG가 ${MAX_PRINT_PNG_BYTES / 1_000_000}MB를 초과합니다. 출력 크기를 줄여 주세요.`,
		)
	}

	const form = new FormData()
	form.set('colorProfile', colorProfile)
	form.set('ppi', String(ppi))
	form.set('image', png, `${fileName}.png`)

	const response = await fetch(`/api/studio-exports/print/${format}`, {
		body: form,
		method: 'POST',
	})
	if (response.status === 429) {
		throw new PrintExportDownloadError(
			`${format.toUpperCase()} 내보내기 요청이 많습니다. 잠시 후 다시 시도해 주세요.`,
		)
	}
	if (!response.ok) {
		throw new PrintExportDownloadError(
			`${format.toUpperCase()} 내보내기에 실패했습니다. 잠시 후 다시 시도해 주세요.`,
		)
	}
	return response.blob()
}
