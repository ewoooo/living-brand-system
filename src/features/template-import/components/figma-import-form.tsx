'use client'

import { useState } from 'react'
import { TemplateRenderer } from '@/components/template-renderer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { type JsonTemplate, jsonTemplateSchema } from '@/types/json-template'

const PREVIEW_WIDTH = 480

interface ImportResult {
	templateId: number
	jsonTemplate: JsonTemplate
	skippedImageNodeIds: string[]
}

export function FigmaImportForm() {
	const [name, setName] = useState('')
	const [sourceUrl, setSourceUrl] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [result, setResult] = useState<ImportResult | null>(null)

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setIsLoading(true)
		setError(null)
		setResult(null)

		try {
			const response = await fetch('/api/templates/import-figma', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, sourceUrl }),
			})
			const body = await response.json().catch(() => null)

			if (!response.ok) {
				setError(body?.message || '임포트에 실패했습니다.')
				return
			}

			setResult({
				templateId: body.templateId,
				jsonTemplate: jsonTemplateSchema.parse(body.jsonTemplate),
				skippedImageNodeIds: body.skippedImageNodeIds ?? [],
			})
		} catch {
			setError('임포트에 실패했습니다.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<section className="flex w-full max-w-xl flex-col gap-4">
			<form onSubmit={handleSubmit} className="flex flex-col gap-2">
				<Input
					value={name}
					onChange={(event) => setName(event.target.value)}
					placeholder="템플릿 이름"
					required
					maxLength={120}
				/>
				<Input
					value={sourceUrl}
					onChange={(event) => setSourceUrl(event.target.value)}
					placeholder="https://www.figma.com/design/...?node-id=..."
					required
					maxLength={500}
				/>
				<Button type="submit" disabled={isLoading}>
					{isLoading ? <Spinner /> : 'Figma에서 가져오기'}
				</Button>
			</form>

			{error && <p className="text-destructive text-xs">{error}</p>}

			{result && (
				<div className="flex flex-col gap-2">
					<p className="text-muted-foreground text-xs">
						템플릿 #{result.templateId} 저장됨 (draft) · 요소{' '}
						{result.jsonTemplate.elements.length}개
						{result.skippedImageNodeIds.length > 0 &&
							` · 이미지 ${result.skippedImageNodeIds.length}개 누락`}
					</p>
					<div className="rounded-md border border-border">
						<TemplateRenderer
							template={result.jsonTemplate}
							scale={Math.min(1, PREVIEW_WIDTH / result.jsonTemplate.width)}
						/>
					</div>
				</div>
			)}
		</section>
	)
}
