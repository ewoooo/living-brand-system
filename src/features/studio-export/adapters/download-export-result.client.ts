'use client'

import { downloadBlob } from '@/lib/object-url'
import type { ExportResult } from '../export-contract'

/** 변환이 끝난 공통 결과를 브라우저 다운로드로 전달한다. */
export function downloadExportResult(result: ExportResult): void {
	downloadBlob(result.data, result.filename)
}
