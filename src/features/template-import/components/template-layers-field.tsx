'use client'

import { useFormFields } from '@payloadcms/ui'
import { useMemo } from 'react'

/**
 * Templates 편집 폼(Admin)의 레이어 패널. 가져온 html을 파싱해 디자인 툴 레이어처럼 이름만 계층으로 보여준다.
 * 읽기 전용 — prop/편집 없음. (텍스트/이미지 변경은 /create)
 */
interface LayerRow {
	id: string
	depth: number
	name: string
	isText: boolean
}

function parseLayers(html: string): LayerRow[] {
	const rows: LayerRow[] = []
	const doc = new DOMParser().parseFromString(html, 'text/html')

	const walk = (el: Element, depth: number) => {
		const isText = el.tagName.toLowerCase() === 'p'
		const name =
			el.getAttribute('data-name') ||
			el.getAttribute('data-node-id') ||
			el.tagName.toLowerCase()
		rows.push({
			id: el.getAttribute('data-node-id') || `${depth}-${rows.length}`,
			depth,
			name,
			isText,
		})
		for (const child of Array.from(el.children)) walk(child, depth + 1)
	}

	for (const root of Array.from(doc.body.children)) walk(root, 0)
	return rows
}

export default function TemplateLayersField() {
	const html = useFormFields(([fields]) => fields.html?.value) as string | undefined

	const layers = useMemo(
		() => (typeof html === 'string' && html.trim() ? parseLayers(html) : []),
		[html],
	)

	if (!layers.length) {
		return (
			<p style={{ color: 'var(--theme-elevation-500)', marginBottom: 'var(--base)' }}>
				레이어 없음 — Figma에서 가져오면 표시됩니다.
			</p>
		)
	}

	return (
		<div
			style={{
				marginBottom: 'var(--base)',
				border: '1px solid var(--theme-elevation-150)',
				borderRadius: 4,
				padding: 8,
				maxHeight: 360,
				overflow: 'auto',
			}}
		>
			<strong style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>레이어</strong>
			{layers.map((layer) => (
				<div
					key={layer.id}
					style={{
						paddingLeft: layer.depth * 14 + 4,
						fontSize: 13,
						lineHeight: '22px',
						color: layer.isText ? 'var(--theme-text)' : 'var(--theme-elevation-600)',
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}
				>
					{layer.isText ? 'T ' : '▸ '}
					{layer.name}
				</div>
			))}
		</div>
	)
}
