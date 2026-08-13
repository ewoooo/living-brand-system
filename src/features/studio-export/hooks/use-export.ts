'use client'

import { useCallback, useRef, useState } from 'react'
import { downloadExportResult } from '../adapters/download-export-result.client'
import type { ExportRequest } from '../export-contract'
import {
	executeStudioExport,
	type StudioExportSource,
	supportsStudioExportSource,
} from '../services/execute-studio-export'
import { type StudioOutputCapability, supportsStudioExportRequest } from '../studio-output'

const DEFAULT_EXPORT_ERROR = '파일을 내보내지 못했습니다. 잠시 후 다시 시도해 주세요.'

/** Studio별 export adapter의 가용성·단일 실행·오류 UI 상태만 공통 소유한다. */
export function useExport<Request extends ExportRequest>({
	capability,
	canExport,
	source,
}: {
	capability: StudioOutputCapability
	canExport?: (request: Request) => boolean
	source: StudioExportSource<Request>
}) {
	const [exporting, setExporting] = useState<Request | null>(null)
	const [error, setError] = useState<string | null>(null)
	const running = useRef(false)

	const supports = useCallback(
		(request: Request) =>
			supportsStudioExportRequest(capability, request) &&
			supportsStudioExportSource(source, request) &&
			(canExport?.(request) ?? true),
		[capability, canExport, source],
	)
	const run = useCallback(
		async (request: Request): Promise<void> => {
			if (running.current || !supports(request)) return
			running.current = true
			setError(null)
			setExporting(request)

			try {
				const result = await executeStudioExport(source, request)
				for (const item of Array.isArray(result) ? result : [result]) {
					downloadExportResult(item)
				}
			} catch (cause) {
				setError(cause instanceof Error ? cause.message : DEFAULT_EXPORT_ERROR)
			} finally {
				running.current = false
				setExporting(null)
			}
		},
		[source, supports],
	)

	return { canExport: supports, error, exporting, run }
}
