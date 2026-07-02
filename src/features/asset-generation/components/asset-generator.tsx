'use client'

import { toPng } from 'html-to-image'
import { useRef, useState } from 'react'
import { TemplateRenderer, type TemplateSlotValue } from '@/components/template-renderer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { PublishedTemplate } from '../services/get-published-template.service'

const PREVIEW_WIDTH = 480

/**
 * Create 화면 본체: 선택한 published 템플릿의 열린 슬롯(locked=false)만 편집하고
 * 결과를 미리보기 그대로 PNG로 내려받는다. 서버 상태 변경은 없다.
 */
export function AssetGenerator({ template }: { template: PublishedTemplate }) {
	const [values, setValues] = useState<Record<string, TemplateSlotValue>>({})
	const [isExporting, setIsExporting] = useState(false)
	const exportRef = useRef<HTMLDivElement>(null)

	function setSlotValue(elementId: string, value: TemplateSlotValue) {
		setValues((current) => ({ ...current, [elementId]: { ...current[elementId], ...value } }))
	}

	async function handleExport() {
		if (!exportRef.current) {
			return
		}

		setIsExporting(true)

		try {
			const dataUrl = await toPng(exportRef.current, { cacheBust: true })
			const link = document.createElement('a')
			link.href = dataUrl
			link.download = `${template.name}.png`
			link.click()
		} finally {
			setIsExporting(false)
		}
	}

	const slots = template.jsonTemplate.elements.filter((element) => !element.locked)

	return (
		<section className="flex w-full flex-col gap-6 md:flex-row">
			<div className="flex w-full flex-col gap-3 md:w-72">
				{slots.map((element) => (
					<div key={element.id} className="flex flex-col gap-1">
						<label
							htmlFor={`slot-${element.id}`}
							className="text-muted-foreground text-xs"
						>
							{element.slotLabel ?? element.id}
						</label>
						{element.type === 'text' ? (
							<Textarea
								id={`slot-${element.id}`}
								value={values[element.id]?.text ?? element.text}
								onChange={(event) =>
									setSlotValue(element.id, { text: event.target.value })
								}
								rows={2}
							/>
						) : (
							<Input
								id={`slot-${element.id}`}
								type="file"
								accept="image/*"
								onChange={(event) => {
									const file = event.target.files?.[0]
									if (file) {
										setSlotValue(element.id, {
											src: URL.createObjectURL(file),
										})
									}
								}}
							/>
						)}
					</div>
				))}
				{slots.length === 0 && (
					<p className="text-muted-foreground text-xs">
						이 템플릿에는 편집 가능한 슬롯이 없습니다.
					</p>
				)}
				<Button onClick={handleExport} disabled={isExporting}>
					{isExporting ? '내보내는 중...' : 'PNG로 내보내기'}
				</Button>
			</div>

			<div className="min-w-0">
				<div className="inline-block rounded-md border border-border">
					<TemplateRenderer
						template={template.jsonTemplate}
						values={values}
						scale={Math.min(1, PREVIEW_WIDTH / template.jsonTemplate.width)}
					/>
				</div>

				{/* 내보내기용 원본 크기 렌더 — 화면 밖에 두고 캡처만 한다. */}
				<div style={{ position: 'fixed', left: -99999, top: 0 }} aria-hidden>
					<div ref={exportRef}>
						<TemplateRenderer template={template.jsonTemplate} values={values} />
					</div>
				</div>
			</div>
		</section>
	)
}
