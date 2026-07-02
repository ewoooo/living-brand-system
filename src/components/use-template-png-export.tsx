'use client'

import { toPng } from 'html-to-image'
import { useEffect, useRef, useState } from 'react'
import type { JsonTemplate } from '@/types/json-template'
import { TemplateRenderer, type TemplateSlotValue } from './template-renderer'

/**
 * 템플릿을 원본 크기 PNG로 내려받는 공유 훅 (/create·챗 첨부가 함께 쓴다).
 * 내보내는 동안에만 화면 밖에 원본 크기 렌더를 마운트해 캡처한다 —
 * 상시 마운트로 인한 DOM·이미지 메모리 점유를 피한다. exportNode를 소비 컴포넌트 JSX에 포함해야 한다.
 */
export function useTemplatePngExport({
	template,
	values,
	fileName,
}: {
	template: JsonTemplate
	values?: Record<string, TemplateSlotValue>
	fileName: string
}) {
	const [isExporting, setIsExporting] = useState(false)
	const [exportError, setExportError] = useState<string | null>(null)
	const exportRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!isExporting) {
			return
		}

		let cancelled = false

		// 마운트 후 레이아웃이 잡힌 다음 캡처한다. 이미지 원본은 toPng가 직접 받아 인라인한다.
		const frame = requestAnimationFrame(async () => {
			const node = exportRef.current

			if (!node || cancelled) {
				return
			}

			try {
				const dataUrl = await toPng(node, { cacheBust: true })
				const link = document.createElement('a')
				link.href = dataUrl
				link.download = `${fileName}.png`
				link.click()
			} catch {
				if (!cancelled) {
					setExportError(
						'PNG 내보내기에 실패했습니다. 이미지 원본 접근(CORS)이 막혀 있을 수 있습니다.',
					)
				}
			} finally {
				if (!cancelled) {
					setIsExporting(false)
				}
			}
		})

		return () => {
			cancelled = true
			cancelAnimationFrame(frame)
		}
	}, [isExporting, fileName])

	function exportPng() {
		setExportError(null)
		setIsExporting(true)
	}

	const exportNode = isExporting ? (
		<div style={{ position: 'fixed', left: -99999, top: 0 }} aria-hidden>
			<div ref={exportRef}>
				<TemplateRenderer template={template} values={values} />
			</div>
		</div>
	) : null

	return { exportPng, isExporting, exportError, exportNode }
}
