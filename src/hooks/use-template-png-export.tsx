'use client'

import { toPng } from 'html-to-image'
import { useEffect, useRef, useState } from 'react'
import { TemplateRenderer, type TemplateSlotValue } from '@/components/template-renderer'
import type { JsonTemplate } from '@/types/json-template'

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

/**
 * 샌드박스(iframe)가 반송한 최종 배치 HTML(전부 인라인 style)을 화면 밖에 심어 PNG로 저장한다.
 * 코드 실행 템플릿은 최종 좌표가 iframe DOM에만 있으므로 부모가 그 outerHTML을 재현해 캡처한다.
 * ponytail: html이 iframe(미검증 코드)에서 오므로 innerHTML은 XSS 천장이 있다 — 현재 템플릿 코드는
 * 1급(우리/manager 저작)이라 허용. 서드파티 plugin 개방 전엔 sanitize하거나 iframe 내부 캡처로 올릴 것.
 */
export async function exportHtmlToPng(html: string, css: string, fileName: string): Promise<void> {
	const holder = document.createElement('div')
	holder.style.cssText = 'position:fixed;left:-99999px;top:0'
	holder.innerHTML = `<style>${css}</style>${html}`
	document.body.appendChild(holder)
	try {
		await new Promise((resolve) => requestAnimationFrame(resolve))
		const stage = holder.querySelector<HTMLElement>('#__stage') ?? holder
		const dataUrl = await toPng(stage, { cacheBust: true })
		const link = document.createElement('a')
		link.href = dataUrl
		link.download = `${fileName}.png`
		link.click()
	} finally {
		holder.remove()
	}
}
