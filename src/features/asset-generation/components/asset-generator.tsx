'use client'

import { useState } from 'react'
import { TemplateRenderer, type TemplateSlotValue } from '@/components/template-renderer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { GenerateTextField } from '@/features/text-generation/components/generate-text-field'
import { useTemplatePngExport } from '@/hooks/use-template-png-export'
import { revokeBlob } from '@/lib/object-url'
import { collectOpenSlotElements, type JsonSlotElement } from '@/types/json-template'
import type { PublishedTemplate } from '../services/get-published-template.service'

const PREVIEW_WIDTH = 480

type TextElement = Extract<JsonSlotElement, { type: 'text' }>

/** 제작자가 요소에 설정한 입력 제약(형식·글자수·줄수)을 적용한 텍스트 슬롯 입력. */
function TextSlotInput({
	id,
	element,
	value,
	onChange,
}: {
	id: string
	element: TextElement
	value: string
	onChange: (text: string) => void
}) {
	if (element.inputFormat !== 'free') {
		const isInvalidEmail =
			element.inputFormat === 'email' && value !== '' && !/^\S+@\S+\.\S+$/.test(value)

		return (
			<>
				<Input
					id={id}
					type={element.inputFormat}
					maxLength={element.maxLength}
					placeholder={element.placeholder ?? element.slotLabel}
					value={value}
					onChange={(event) => onChange(event.target.value)}
				/>
				{isInvalidEmail && (
					<p className="text-destructive text-xs">이메일 형식이 아닙니다.</p>
				)}
			</>
		)
	}

	return (
		<Textarea
			id={id}
			maxLength={element.maxLength}
			placeholder={element.placeholder ?? element.slotLabel}
			rows={2}
			value={value}
			onChange={(event) => {
				const next = event.target.value

				// 명시적 줄 수 제한 — 폭에 의한 자동 줄바꿈 초과분은 렌더가 잘라낸다.
				if (element.maxLines && next.split('\n').length > element.maxLines) {
					return
				}
				onChange(next)
			}}
		/>
	)
}

/**
 * Create 화면 본체: 선택한 published 템플릿의 열린 슬롯(locked=false)만 편집하고
 * 결과를 미리보기 그대로 PNG로 내려받는다. 서버 상태 변경은 없다.
 */
export function AssetGenerator({ template }: { template: PublishedTemplate }) {
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
							className="text-muted-foreground text-xs"
						>
							{element.slotLabel ?? element.id}
						</label>
						{element.type === 'text' ? (
							<>
								<TextSlotInput
									id={`slot-${element.id}`}
									element={element}
									value={values[element.id]?.text ?? ''}
									onChange={(text) => setSlotValue(element.id, { text })}
								/>
								<GenerateTextField
									defaultPrompt={element.placeholder || element.slotLabel || ''}
									onGenerated={(text) => setSlotValue(element.id, { text })}
								/>
							</>
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
					<p className="text-muted-foreground text-xs">
						이 템플릿에는 편집 가능한 슬롯이 없습니다.
					</p>
				)}
				<Button onClick={exportPng} disabled={isExporting}>
					{isExporting ? '내보내는 중...' : 'PNG로 내보내기'}
				</Button>
				{exportError && <p className="text-destructive text-xs">{exportError}</p>}
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
