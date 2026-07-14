'use client'

import { useForm, useFormFields } from '@payloadcms/ui'
import { useMemo, useState } from 'react'

/**
 * Templates 편집 폼(Admin)의 레이어 패널.
 * 가져온 html을 파싱해 Figma 레이어처럼 계층(들여쓰기)·종류(data-figma-type)·이름(data-name)을 보여준다.
 * 레이어를 선택하면 그 노드의 값을 편집한다 — 지금은 텍스트 노드의 텍스트 내용 교체(html을 직접 패치).
 * 편집은 Figma가 아니라 "값 교체"만: 레이아웃/위치는 Figma가 소유하므로 여기서 바꾸지 않는다.
 */
interface LayerRow {
	id: string
	depth: number
	name: string
	figmaType: string
	isText: boolean
	text: string
}

const TYPE_LABEL: Record<string, string> = {
	FRAME: '프레임',
	GROUP: '그룹',
	SECTION: '섹션',
	COMPONENT: '컴포넌트',
	COMPONENT_SET: '컴포넌트셋',
	INSTANCE: '인스턴스',
	TEXT: '텍스트',
	RECTANGLE: '사각형',
	ELLIPSE: '타원',
	LINE: '선',
	VECTOR: '벡터',
	STAR: '별',
	POLYGON: '다각형',
	BOOLEAN_OPERATION: '불리언',
}
const typeLabel = (t: string) => TYPE_LABEL[t] ?? t

function parseLayers(html: string): LayerRow[] {
	const rows: LayerRow[] = []
	const doc = new DOMParser().parseFromString(html, 'text/html')

	const walk = (el: Element, depth: number) => {
		const figmaType =
			el.getAttribute('data-figma-type') ||
			(el.tagName.toLowerCase() === 'p' ? 'TEXT' : 'FRAME')
		const isText = figmaType === 'TEXT'
		rows.push({
			id: el.getAttribute('data-node-id') || `${depth}-${rows.length}`,
			depth,
			name: el.getAttribute('data-name') || typeLabel(figmaType),
			figmaType,
			isText,
			text: isText ? (el.textContent ?? '') : '',
		})
		for (const child of Array.from(el.children)) walk(child, depth + 1)
	}

	for (const root of Array.from(doc.body.children)) walk(root, 0)
	return rows
}

// html 문자열에서 특정 노드의 텍스트만 교체해 되돌린다. 직렬화가 style의 " 를 &quot;로 다시 이스케이프하므로 안전.
function setNodeText(html: string, nodeId: string, text: string): string {
	const doc = new DOMParser().parseFromString(html, 'text/html')
	const el = doc.querySelector(`[data-node-id="${nodeId}"]`)
	if (!el) return html
	el.textContent = text
	return doc.body.innerHTML
}

export default function TemplateLayersField() {
	const { dispatchFields, setModified } = useForm()
	const html = useFormFields(([fields]) => fields.html?.value) as string | undefined
	const [selectedId, setSelectedId] = useState<string | null>(null)

	const layers = useMemo(
		() => (typeof html === 'string' && html.trim() ? parseLayers(html) : []),
		[html],
	)
	const selected = layers.find((l) => l.id === selectedId) ?? null

	if (!layers.length) {
		return (
			<p style={{ color: 'var(--theme-elevation-500)', marginBottom: 'var(--base)' }}>
				레이어 없음 — Figma에서 가져오면 표시됩니다.
			</p>
		)
	}

	function commitText(text: string) {
		if (typeof html !== 'string' || !selectedId) return
		dispatchFields({ type: 'UPDATE', path: 'html', value: setNodeText(html, selectedId, text) })
		setModified(true)
	}

	return (
		<div style={{ marginBottom: 'var(--base)' }}>
			<div
				style={{
					border: '1px solid var(--theme-elevation-150)',
					borderRadius: 4,
					padding: 8,
					maxHeight: 360,
					overflow: 'auto',
				}}
			>
				<strong style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>레이어</strong>
				{layers.map((layer) => {
					const isSelected = layer.id === selectedId
					return (
						<button
							key={layer.id}
							type="button"
							onClick={() => setSelectedId(layer.id)}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 6,
								width: '100%',
								textAlign: 'left',
								border: 'none',
								borderRadius: 3,
								cursor: 'pointer',
								paddingLeft: layer.depth * 14 + 4,
								paddingTop: 2,
								paddingBottom: 2,
								fontSize: 13,
								lineHeight: '22px',
								background: isSelected
									? 'var(--theme-elevation-100)'
									: 'transparent',
								color: layer.isText
									? 'var(--theme-text)'
									: 'var(--theme-elevation-600)',
							}}
						>
							<span
								style={{
									flexShrink: 0,
									fontSize: 11,
									color: 'var(--theme-elevation-400)',
									minWidth: 44,
								}}
							>
								{typeLabel(layer.figmaType)}
							</span>
							<span
								style={{
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
								}}
							>
								{layer.name}
							</span>
						</button>
					)
				})}
			</div>

			{selected?.isText && (
				<label style={{ display: 'block', marginTop: 8 }}>
					<span
						style={{
							display: 'block',
							fontSize: 12,
							marginBottom: 4,
							color: 'var(--theme-elevation-600)',
						}}
					>
						텍스트 편집 — {selected.name}
					</span>
					<textarea
						value={selected.text}
						onChange={(event) => commitText(event.target.value)}
						rows={2}
						style={{
							width: '100%',
							fontSize: 13,
							padding: 6,
							borderRadius: 4,
							border: '1px solid var(--theme-elevation-150)',
							background: 'var(--theme-input-bg)',
							color: 'var(--theme-text)',
						}}
					/>
				</label>
			)}

			{selected && !selected.isText && (
				<p style={{ marginTop: 8, fontSize: 12, color: 'var(--theme-elevation-500)' }}>
					{typeLabel(selected.figmaType)} 레이어는 아직 편집할 값이 없습니다 (이미지
					교체는 추후).
				</p>
			)}
		</div>
	)
}
