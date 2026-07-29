'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { PublishedHtmlTemplate } from '@/features/template-create/services/get-published-template.service'
import { useTemplateExport } from '@/features/template-export/hooks/use-template-export'
import { pixelsToMillimeters } from '@/features/template-export/print-policy'
import { collectTemplateSlots } from '@/services/collect-template-slots.service'
import { composeTemplateHtml } from '@/services/compose-template-html.client'
import { TextSlotInput } from './text-slot-input'

const PREVIEW_WIDTH = 480

/**
 * Figma에서 가져온 published HTML의 열린 슬롯(input이 달린 텍스트 노드)을 편집해
 * 미리보기 그대로 PNG·운영자 정책의 TIFF 또는 RGB 벡터 PDF로 내보낸다. 서버 상태 변경은 없다 —
 * 입력값은 로컬 state로만 합성한다.
 * 미리보기는 어드민 캔버스와 동일한 동일-문서 렌더 — iframe(opaque origin)은 벡터 mask의
 * CORS 로드를 깨뜨린다. 임포트 HTML은 스크립트 없는 inline-style이다.
 */
export function HtmlAssetGenerator({ template }: { template: PublishedHtmlTemplate }) {
	const [values, setValues] = useState<Record<string, string>>({})
	const { html, nodeConfigs, width, height } = template
	const scale = Math.min(1, PREVIEW_WIDTH / width)

	const slots = useMemo(() => collectTemplateSlots(html, nodeConfigs), [html, nodeConfigs])

	// 사용자가 만진 슬롯만 텍스트 오버라이드로 합성한다(만지지 않은 슬롯은 저작 텍스트 유지).
	const composedHtml = useMemo(
		() =>
			composeTemplateHtml(
				html,
				Object.fromEntries(
					Object.entries(values).map(([nodeId, text]) => [nodeId, { text }]),
				),
			),
		[html, values],
	)
	const { exporting, exportError, exportTemplate } = useTemplateExport({
		fileName: template.name,
		height,
		html: composedHtml,
		printPpi: template.printPpi,
		templateId: template.id,
		templateVersion: template.templateVersion,
		width,
	})

	return (
		<section className="flex w-full flex-col gap-6 md:flex-row">
			<div className="flex w-full flex-col gap-3 md:w-72">
				{slots.map((slot) => (
					<div key={slot.nodeId} className="flex flex-col gap-1">
						<label
							htmlFor={`slot-${slot.nodeId}`}
							className="font-body text-sm font-normal text-muted-foreground"
						>
							{slot.input.label ?? slot.name}
						</label>
						<TextSlotInput
							id={`slot-${slot.nodeId}`}
							spec={slot.input}
							value={values[slot.nodeId] ?? slot.text}
							onChange={(text) =>
								setValues((current) => ({ ...current, [slot.nodeId]: text }))
							}
						/>
					</div>
				))}
				{slots.length === 0 && (
					<p className="font-body text-sm font-normal text-muted-foreground">
						이 템플릿에는 편집 가능한 슬롯이 없습니다.
					</p>
				)}
				<Button onClick={() => exportTemplate('png')} disabled={exporting !== null}>
					{exporting === 'png' ? '내보내는 중...' : 'PNG로 내보내기'}
				</Button>
				{template.printPpi && (
					<>
						<Button
							onClick={() => exportTemplate('tiff')}
							disabled={exporting !== null}
							variant="outline"
						>
							{exporting === 'tiff' ? '내보내는 중...' : 'CMYK TIFF로 내보내기'}
						</Button>
						<Button
							onClick={() => exportTemplate('pdf')}
							disabled={exporting !== null}
							variant="outline"
						>
							{exporting === 'pdf' ? '인쇄창 여는 중...' : 'RGB 벡터 PDF로 저장'}
						</Button>
						<p className="font-body text-xs font-normal text-muted-foreground">
							{template.printPpi}ppi ·{' '}
							{pixelsToMillimeters(width, template.printPpi).toFixed(1)} ×{' '}
							{pixelsToMillimeters(height, template.printPpi).toFixed(1)}mm · PDF RGB
						</p>
					</>
				)}
				{exportError && (
					<p className="font-body text-sm font-normal text-destructive">{exportError}</p>
				)}
			</div>

			<div className="min-w-0">
				<div
					className="overflow-hidden rounded-md border border-border"
					style={{ width: width * scale, height: height * scale }}
				>
					<div
						style={{
							width,
							height,
							transform: `scale(${scale})`,
							transformOrigin: 'top left',
						}}
						// biome-ignore lint/security/noDangerouslySetInnerHtml: 서버 컨버터가 만든 inline-style HTML(스크립트 없음) — 어드민 캔버스와 동일 렌더
						dangerouslySetInnerHTML={{ __html: composedHtml }}
					/>
				</div>
			</div>
		</section>
	)
}
