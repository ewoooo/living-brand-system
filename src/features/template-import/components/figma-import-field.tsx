'use client'

import { Button, TextInput, toast, useForm } from '@payloadcms/ui'
import { useState } from 'react'

/**
 * Templates 편집 폼(Admin)의 Figma 가져오기 UI 필드.
 * 변환 API를 호출해 폼의 jsonTemplate·sourceUrl 값을 채우고, 저장 여부는 Manager가 폼에서 결정한다.
 */
export default function FigmaImportField() {
	const { dispatchFields, setModified } = useForm()
	const [sourceUrl, setSourceUrl] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	async function handleImport() {
		if (!sourceUrl.trim()) {
			toast.error('node-id가 포함된 Figma URL을 입력하세요.')
			return
		}

		setIsLoading(true)

		try {
			const response = await fetch('/api/templates/convert-figma', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sourceUrl }),
			})
			const body = await response.json().catch(() => null)

			if (!response.ok) {
				toast.error(body?.message || 'Figma 변환에 실패했습니다.')
				return
			}

			dispatchFields({ type: 'UPDATE', path: 'jsonTemplate', value: body.jsonTemplate })
			dispatchFields({ type: 'UPDATE', path: 'sourceUrl', value: sourceUrl })
			setModified(true)

			const skipped = body.skippedImageNodeIds?.length
			toast.success(
				`가져오기 완료 — 요소 ${body.jsonTemplate.elements.length}개${skipped ? `, 이미지 ${skipped}개 누락` : ''}. 저장해야 반영됩니다.`,
			)
		} catch {
			toast.error('Figma 변환에 실패했습니다.')
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
				path="figmaImportUrl"
				label="Figma에서 가져오기"
				description="프레임 링크를 붙여넣으세요"
				placeholder="https://www.figma.com/design/...?node-id=..."
				value={sourceUrl}
				style={{ flex: 1 }}
				onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
					setSourceUrl(event.target.value)
				}
			/>
			<Button onClick={handleImport} disabled={isLoading} buttonStyle="secondary">
				{isLoading ? '변환 중...' : '변환'}
			</Button>
		</div>
	)
}
