'use client'

import { useState } from 'react'
import { TemplateRenderer, type TemplateSlotValue } from '@/components/template-renderer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTemplatePngExport } from '@/hooks/use-template-png-export'
import { revokeBlob } from '@/lib/object-url'
import { collectOpenSlotElements } from '@/types/json-template'
import type { PublishedJsonTemplate } from '../services/get-published-template.service'
import { TextSlotInput } from './text-slot-input'

const PREVIEW_WIDTH = 480

/**
 * Create 화면 본체: 선택한 published 템플릿의 열린 슬롯(locked=false)만 편집하고
 * 결과를 미리보기 그대로 PNG로 내려받는다. 서버 상태 변경은 없다.
 */
export function AssetGenerator({ template }: { template: PublishedJsonTemplate }) {
	const [values, setValues] = useState<Record<string, TemplateSlotValue>>({})
	const { exportPng, isExporting, exportError, exportNode } = useTemplatePngExport({
		template: template.jsonTemplate,
		values,
		fileName: template.name,
	})

	function setSlotValue(elementId: string, value: TemplateSlotValue) {
		setValues((current) => ({ ...current, [elementId]: { ...current[elementId], ...value } }))
	}

	function setSlotImage(elementId: string, file: File) {
		// 교체된 blob URL은 즉시 해제해 세션 동안의 메모리 누수를 막는다.
		revokeBlob(values[elementId]?.src)
		setSlotValue(elementId, { src: URL.createObjectURL(file) })
	}

	const slots = collectOpenSlotElements(template.jsonTemplate.elements)

	return (
		<section className="flex w-full flex-col gap-6 md:flex-row">
			<div className="flex w-full flex-col gap-3 md:w-72">
				{slots.map((element) => (
					<div key={element.id} className="flex flex-col gap-1">
						<label
							htmlFor={`slot-${element.id}`}
							className="font-body text-sm font-normal text-muted-foreground"
						>
							{element.slotLabel ?? element.id}
						</label>
						{element.type === 'text' ? (
							<TextSlotInput
								id={`slot-${element.id}`}
								spec={{ ...element, label: element.slotLabel }}
								value={values[element.id]?.text ?? ''}
								onChange={(text) => setSlotValue(element.id, { text })}
							/>
						) : (
							<Input
								id={`slot-${element.id}`}
								type="file"
								accept="image/*"
								onChange={(event) => {
									const file = event.target.files?.[0]
									if (file) {
										setSlotImage(element.id, file)
									}
								}}
							/>
						)}
					</div>
				))}
				{slots.length === 0 && (
					<p className="font-body text-sm font-normal text-muted-foreground">
						이 템플릿에는 편집 가능한 슬롯이 없습니다.
					</p>
				)}
				<Button onClick={exportPng} disabled={isExporting}>
					{isExporting ? '내보내는 중...' : 'PNG로 내보내기'}
				</Button>
				{exportError && (
					<p className="font-body text-sm font-normal text-destructive">{exportError}</p>
				)}
			</div>

			<div className="min-w-0">
				<div className="inline-block max-w-full overflow-x-auto rounded-md border border-border">
					<TemplateRenderer
						template={template.jsonTemplate}
						values={values}
						scale={Math.min(1, PREVIEW_WIDTH / template.jsonTemplate.width)}
					/>
				</div>
				{exportNode}
			</div>
		</section>
	)
}
