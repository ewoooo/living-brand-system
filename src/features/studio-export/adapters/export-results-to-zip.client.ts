'use client'

import { type Zippable, zipSync } from 'fflate'
import type { ExportPackageRequest, ExportResult } from '../export-contract'

/** 여러 ExportResult를 UTF-8 파일명의 ZIP 하나로 패키징한다. */
export async function exportResultsToZip(request: ExportPackageRequest): Promise<ExportResult> {
	const entries: Zippable = {}
	for (const item of request.items) {
		if (!item.filename || /[\\/]/.test(item.filename) || entries[item.filename]) {
			throw new Error(`ZIP 파일명이 올바르지 않습니다: ${item.filename}`)
		}
		entries[item.filename] = new Uint8Array(await item.data.arrayBuffer())
	}
	const data = zipSync(entries, { level: 6 })
	return {
		data: new Blob([data], { type: 'application/zip' }),
		filename: request.filename.endsWith('.zip') ? request.filename : `${request.filename}.zip`,
		mimeType: 'application/zip',
	}
}
