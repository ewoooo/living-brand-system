'use client'

import { useCallback, useRef, useState } from 'react'

const DEFAULT_EXPORT_ERROR = '파일을 내보내지 못했습니다. 잠시 후 다시 시도해 주세요.'

/** Studio별 export adapter의 가용성·단일 실행·오류 UI 상태만 공통 소유한다. */
export function useExport<Action extends string>({
	canExport,
	execute,
}: {
	canExport: (action: Action) => boolean
	execute: (action: Action) => Promise<void> | void
}) {
	const [exporting, setExporting] = useState<Action | null>(null)
	const [error, setError] = useState<string | null>(null)
	const running = useRef(false)
	const canExportRef = useRef(canExport)
	const executeRef = useRef(execute)
	canExportRef.current = canExport
	executeRef.current = execute

	const supports = useCallback((action: Action) => canExportRef.current(action), [])
	const run = useCallback(async (action: Action): Promise<void> => {
		if (running.current || !canExportRef.current(action)) return
		running.current = true
		setError(null)
		setExporting(action)

		try {
			await executeRef.current(action)
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : DEFAULT_EXPORT_ERROR)
		} finally {
			running.current = false
			setExporting(null)
		}
	}, [])

	return { canExport: supports, error, exporting, run }
}
