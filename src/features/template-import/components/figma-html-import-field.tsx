'use client'

import { toast, useForm, useFormFields } from '@payloadcms/ui'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { importFigmaHtmlFromUrl } from '@/features/template-import/services/import-figma-html.client'
import {
	composeTemplateHtml,
	type TemplateOverrides,
} from '@/features/template-import/utils/compose-template-html'

/**
 * Templates 편집 폼(Admin)의 Figma 가져오기 UI 필드.
 * 입력창은 sourceUrl 폼 필드를 그대로 편집한다(별도 Source Url 필드와 통합).
 * 가져오면 baseHtml(원본)만 갱신하고 기존 overrides(앱 편집)는 유지해 html을 재합성한다 → 앱 작업 보존.
 * 저장은 Manager가 폼에서 결정한다.
 */
export default function FigmaHtmlImportField() {
	const { dispatchFields, getData, setModified } = useForm()
	const sourceUrl = (useFormFields(([fields]) => fields.sourceUrl?.value) as string) ?? ''
	const setSourceUrl = (value: string) =>
		dispatchFields({ type: 'UPDATE', path: 'sourceUrl', value })
	const [isLoading, setIsLoading] = useState(false)

	async function handleImport() {
		if (!sourceUrl.trim()) {
			toast.error('node-id가 포함된 Figma URL을 입력하세요.')
			return
		}

		setIsLoading(true)

		try {
			const imported = await importFigmaHtmlFromUrl(sourceUrl)

			// imported.html = 새 base. 기존 overrides를 유지한 채 재합성 → 재import에도 앱 편집이 보존된다.
			const currentOverrides = (getData()?.overrides ?? {}) as TemplateOverrides
			dispatchFields({ type: 'UPDATE', path: 'baseHtml', value: imported.html })
			dispatchFields({
				type: 'UPDATE',
				path: 'html',
				value: composeTemplateHtml(imported.html, currentOverrides),
			})
			dispatchFields({ type: 'UPDATE', path: 'width', value: imported.width })
			dispatchFields({ type: 'UPDATE', path: 'height', value: imported.height })
			dispatchFields({ type: 'UPDATE', path: 'sourceUrl', value: sourceUrl })
			// 이름이 비어 있을 때만 Figma 프레임 이름을 채운다.
			if (!getData()?.name && imported.name) {
				dispatchFields({ type: 'UPDATE', path: 'name', value: imported.name })
			}
			setModified(true)

			toast.success(
				`가져오기 완료 — ${imported.width}×${imported.height}. 저장해야 반영됩니다.`,
			)
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Figma 가져오기에 실패했습니다.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="figma-html-import-field">
			<Field>
				<FieldLabel htmlFor="figmaHtmlImportUrl">Figma 소스 URL</FieldLabel>
				<Input
					id="figmaHtmlImportUrl"
					placeholder="https://www.figma.com/design/...?node-id=..."
					value={sourceUrl}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
						setSourceUrl(event.target.value)
					}
				/>
				<FieldDescription>
					Dev Mode 프레임 링크(node-id 포함). 가져오기로 변환하며, 출처로도 저장됩니다.
				</FieldDescription>
			</Field>
			<Button type="button" onClick={handleImport} disabled={isLoading} variant="secondary">
				{isLoading ? '가져오는 중...' : '가져오기'}
			</Button>
		</div>
	)
}
