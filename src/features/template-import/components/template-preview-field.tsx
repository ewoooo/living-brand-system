'use client'

import { useFormFields } from '@payloadcms/ui'
import { useMemo } from 'react'
import { TemplateRenderer } from '@/components/template-renderer'
import { jsonTemplateSchema } from '@/types/json-template'

const PREVIEW_MAX_WIDTH = 640

/**
 * Templates 편집 폼(Admin)의 렌더-only 미리보기. 편집(드래그·인스펙터)은 없다 — 구체적 텍스트/이미지 변경은 /create.
 * Figma에서 가져온 inline-style `html`이 있으면 그대로 렌더(런타임에 뜸)하고, 없으면 레거시 jsonTemplate를 렌더한다.
 */
export default function TemplatePreviewField() {
	const html = useFormFields(([fields]) => fields.html?.value) as string | undefined
	const width = useFormFields(([fields]) => fields.width?.value) as number | undefined
	const height = useFormFields(([fields]) => fields.height?.value) as number | undefined
	const jsonValue = useFormFields(([fields]) => fields.jsonTemplate?.value)

	const parsed = useMemo(() => jsonTemplateSchema.safeParse(jsonValue), [jsonValue])

	// 1) Figma import HTML 우선 (inline-style이라 Tailwind 스캔 없이 그대로 렌더).
	if (typeof html === 'string' && html.trim()) {
		const w = typeof width === 'number' && width > 0 ? width : PREVIEW_MAX_WIDTH
		const h = typeof height === 'number' && height > 0 ? height : PREVIEW_MAX_WIDTH
		const scale = Math.min(1, PREVIEW_MAX_WIDTH / w)

		return (
			<div style={{ marginBottom: 'var(--base)' }}>
				<div
					style={{
						width: w * scale,
						height: h * scale,
						overflow: 'hidden',
						border: '1px solid var(--theme-elevation-150)',
					}}
				>
					<div
						style={{
							width: w,
							height: h,
							transform: `scale(${scale})`,
							transformOrigin: 'top left',
						}}
						// biome-ignore lint/security/noDangerouslySetInnerHtml: 서버 컨버터가 만든 inline-style HTML(스크립트 없음)
						dangerouslySetInnerHTML={{ __html: html }}
					/>
				</div>
			</div>
		)
	}

	// 2) 레거시 jsonTemplate 렌더.
	if (jsonValue == null) {
		return (
			<p style={{ color: 'var(--theme-elevation-500)', marginBottom: 'var(--base)' }}>
				Figma에서 가져오면 미리보기가 표시됩니다.
			</p>
		)
	}

	if (!parsed.success) {
		return (
			<p style={{ color: 'var(--theme-error-500)', marginBottom: 'var(--base)' }}>
				렌더할 수 있는 디자인이 없습니다 (html/jsonTemplate 비어 있거나 형식 불일치).
			</p>
		)
	}

	const template = parsed.data
	const scale = Math.min(1, PREVIEW_MAX_WIDTH / template.width)

	return (
		<div
			style={{
				marginBottom: 'var(--base)',
				width: 'fit-content',
				border: '1px solid var(--theme-elevation-150)',
			}}
		>
			<TemplateRenderer template={template} scale={scale} />
		</div>
	)
}
