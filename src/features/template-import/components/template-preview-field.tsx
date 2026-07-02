'use client'

import { TextInput, useForm, useFormFields } from '@payloadcms/ui'
import { useMemo, useState } from 'react'
import { TemplateRenderer } from '@/components/template-renderer'
import { type JsonTemplate, jsonTemplateSchema } from '@/types/json-template'

const PREVIEW_MAX_WIDTH = 640

/**
 * Templates 편집 폼(Admin)의 jsonTemplate 시각 미리보기 + 요소 편집 UI 필드.
 * 폼의 jsonTemplate 값을 그대로 구독하므로 가져오기·JSON 수동 편집과 항상 동기화된다.
 * 요소를 클릭해 슬롯 여부, 슬롯 이름, 텍스트 내용을 고치면 폼 값에 즉시 반영된다.
 */
export default function TemplatePreviewField() {
	const { dispatchFields, setModified } = useForm()
	const jsonValue = useFormFields(([fields]) => fields.jsonTemplate?.value)
	const [selectedId, setSelectedId] = useState<string | null>(null)

	const parsed = useMemo(() => jsonTemplateSchema.safeParse(jsonValue), [jsonValue])

	if (jsonValue == null) {
		return (
			<p style={{ color: 'var(--theme-elevation-500)', marginBottom: 'var(--base)' }}>
				jsonTemplate이 비어 있습니다. Figma에서 가져오면 미리보기가 표시됩니다.
			</p>
		)
	}

	if (!parsed.success) {
		return (
			<p style={{ color: 'var(--theme-error-500)', marginBottom: 'var(--base)' }}>
				jsonTemplate이 스키마(src/types/json-template.ts)와 맞지 않아 미리보기를 그릴 수
				없습니다.
			</p>
		)
	}

	const template = parsed.data
	const scale = Math.min(1, PREVIEW_MAX_WIDTH / template.width)
	const selected = template.elements.find((element) => element.id === selectedId)

	function updateTemplate(next: JsonTemplate) {
		dispatchFields({ type: 'UPDATE', path: 'jsonTemplate', value: next })
		setModified(true)
	}

	function updateSelected(patch: { locked?: boolean; slotLabel?: string; text?: string }) {
		if (!selected) {
			return
		}

		updateTemplate({
			...template,
			elements: template.elements.map((element) =>
				element.id === selected.id
					? ({ ...element, ...patch } as JsonTemplate['elements'][number])
					: element,
			),
		})
	}

	return (
		<div
			style={{
				display: 'flex',
				flexWrap: 'wrap',
				gap: 'var(--base)',
				alignItems: 'flex-start',
				marginBottom: 'var(--base)',
			}}
		>
			<div style={{ position: 'relative', border: '1px solid var(--theme-elevation-150)' }}>
				<TemplateRenderer template={template} scale={scale} />
				{/* 요소 선택 오버레이 — 렌더 위에 클릭 영역만 얹는다. */}
				{template.elements.map((element) => {
					const isSelected = element.id === selectedId

					return (
						<button
							type="button"
							key={element.id}
							onClick={() => setSelectedId(isSelected ? null : element.id)}
							aria-label={element.slotLabel || element.id}
							title={`${element.slotLabel || element.id}${element.locked ? ' (고정)' : ' (슬롯)'}`}
							style={{
								position: 'absolute',
								left: element.x * scale,
								top: element.y * scale,
								width: element.width * scale,
								height: element.height * scale,
								zIndex: element.zIndex + 1,
								padding: 0,
								background: 'transparent',
								cursor: 'pointer',
								border: isSelected
									? '2px solid var(--theme-success-400, #22c55e)'
									: element.locked
										? '1px dashed color-mix(in srgb, currentColor 25%, transparent)'
										: '1px dashed var(--theme-success-400, #22c55e)',
							}}
						/>
					)
				})}
			</div>

			{selected && (
				<div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 8 }}>
					<strong style={{ fontSize: 13 }}>
						{selected.type} · {selected.slotLabel || selected.id}
					</strong>
					<label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
						<input
							type="checkbox"
							checked={!selected.locked}
							onChange={(event) => updateSelected({ locked: !event.target.checked })}
						/>
						슬롯으로 열기 (Create에서 편집 허용)
					</label>
					<TextInput
						path="templatePreviewSlotLabel"
						label="슬롯 이름"
						value={selected.slotLabel ?? ''}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
							updateSelected({ slotLabel: event.target.value })
						}
					/>
					{selected.type === 'text' && (
						<TextInput
							path="templatePreviewText"
							label="텍스트 내용"
							value={selected.text}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateSelected({ text: event.target.value })
							}
						/>
					)}
				</div>
			)}
		</div>
	)
}
