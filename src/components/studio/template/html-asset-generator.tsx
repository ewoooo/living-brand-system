'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { PublishedHtmlTemplate } from '@/features/asset-generation/services/get-published-template.service'
import {
	collectHtmlSlots,
	type HtmlSlot,
} from '@/features/asset-generation/utils/collect-html-slots'
import { exportHtmlToPng } from '@/features/asset-generation/utils/export-template-png'
import { composeTemplateHtml } from '@/features/template-import/utils/compose-template-html'
import { TextSlotInput } from './text-slot-input'

const PREVIEW_WIDTH = 480

/**
 * Figma에서 가져온 published HTML의 열린 슬롯(input이 달린 텍스트 노드)을 편집해
 * 미리보기 그대로 PNG로 내보낸다. 서버 상태 변경은 없다 — 입력값은 로컬 state로만 합성한다.
 * 미리보기는 어드민 캔버스와 동일한 동일-문서 렌더 — iframe(opaque origin)은 벡터 mask의
 * CORS 로드를 깨뜨린다. 임포트 HTML은 스크립트 없는 inline-style이다.
 */
export function HtmlAssetGenerator({ template }: { template: PublishedHtmlTemplate }) {
	const [values, setValues] = useState<Record<string, string>>({})
	const [isExporting, setIsExporting] = useState(false)
	const [exportError, setExportError] = useState<string | null>(null)
	const { html, overrides, width, height } = template
	const scale = Math.min(1, PREVIEW_WIDTH / width)

	const slots = useMemo(() => collectHtmlSlots(html, overrides), [html, overrides])

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

	async function exportPng() {
		setExportError(null)
		setIsExporting(true)

		try {
			await exportHtmlToPng(composedHtml, '', template.name)
		} catch {
			setExportError(
				'PNG 내보내기에 실패했습니다. 이미지 원본 접근(CORS)이 막혀 있을 수 있습니다.',
			)
		} finally {
			setIsExporting(false)
		}
	}

	return (
		<section className="flex w-full flex-col gap-6 md:flex-row">
			<TemplateSlotControls
				error={exportError}
				isExporting={isExporting}
				onExport={exportPng}
				onValueChange={(nodeId, text) =>
					setValues((current) => ({ ...current, [nodeId]: text }))
				}
				slots={slots}
				values={values}
			/>
			<TemplatePreview height={height} html={composedHtml} scale={scale} width={width} />
		</section>
	)
}

/** 슬롯 입력 열의 고정 폭과 세로 흐름을 소유한다. */
function TemplateSlotControls({
	error,
	isExporting,
	onExport,
	onValueChange,
	slots,
	values,
}: {
	error: string | null
	isExporting: boolean
	onExport: () => void
	onValueChange: (nodeId: string, text: string) => void
	slots: HtmlSlot[]
	values: Record<string, string>
}) {
	return (
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
						onChange={(text) => onValueChange(slot.nodeId, text)}
					/>
				</div>
			))}
			{slots.length === 0 && (
				<p className="font-body text-sm font-normal text-muted-foreground">
					이 템플릿에는 편집 가능한 슬롯이 없습니다.
				</p>
			)}
			<Button onClick={onExport} disabled={isExporting}>
				{isExporting ? '내보내는 중...' : 'PNG로 내보내기'}
			</Button>
			{error && <p className="font-body text-sm font-normal text-destructive">{error}</p>}
		</div>
	)
}

/** 원본 비율과 contain scale을 적용한 미리보기 공간을 소유한다. */
function TemplatePreview({
	height,
	html,
	scale,
	width,
}: {
	height: number
	html: string
	scale: number
	width: number
}) {
	return (
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
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			</div>
		</div>
	)
}
