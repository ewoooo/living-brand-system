'use client'

import { Button, TextInput, toast, useForm, useFormFields } from '@payloadcms/ui'
import { useState } from 'react'

/**
 * Templates 편집 폼(Admin)의 Figma 가져오기 UI 필드.
 * 입력창은 sourceUrl 폼 필드를 그대로 편집한다(별도 Source Url 필드와 통합). 링크를 변환 API로 보내
 * 폼의 html·width·height·sourceUrl(·비어있으면 name) 값을 채운다. 저장은 Manager가 폼에서 결정한다.
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
			const response = await fetch('/api/templates/import-figma-html', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sourceUrl }),
			})
			const body = await response.json().catch(() => null)

			if (!response.ok) {
				toast.error(body?.message || 'Figma 가져오기에 실패했습니다.')
				return
			}

			dispatchFields({ type: 'UPDATE', path: 'html', value: body.html })
			dispatchFields({ type: 'UPDATE', path: 'width', value: body.width })
			dispatchFields({ type: 'UPDATE', path: 'height', value: body.height })
			dispatchFields({ type: 'UPDATE', path: 'sourceUrl', value: sourceUrl })
			// 이름이 비어 있을 때만 Figma 프레임 이름을 채운다.
			if (!getData()?.name && body.name) {
				dispatchFields({ type: 'UPDATE', path: 'name', value: body.name })
			}
			setModified(true)

			toast.success(`가져오기 완료 — ${body.width}×${body.height}. 저장해야 반영됩니다.`)
		} catch {
			toast.error('Figma 가져오기에 실패했습니다.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div
			style={{
				marginBottom: 'var(--base)',
				display: 'flex',
				gap: 8,
				alignItems: 'flex-start',
			}}
		>
			<TextInput
				path="figmaHtmlImportUrl"
				label="Figma 소스 URL"
				description="Dev Mode 프레임 링크(node-id 포함). 가져오기로 변환하며, 출처로도 저장됩니다."
				placeholder="https://www.figma.com/design/...?node-id=..."
				value={sourceUrl}
				style={{ flex: 1 }}
				onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
					setSourceUrl(event.target.value)
				}
			/>
			<Button onClick={handleImport} disabled={isLoading} buttonStyle="secondary">
				{isLoading ? '가져오는 중...' : '가져오기'}
			</Button>
		</div>
	)
}
