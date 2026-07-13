'use client'

import { useState } from 'react'

export interface ImageGenerationResult {
	images: string[]
	prompt: string
	sceneId: string
}

interface ImageGenerationRequest {
	count: number
	prompt: string
	sceneId: string
}

const GENERATION_ERROR_MESSAGE =
	'이미지 생성에 실패했어요. 무료 엔진이 느려 그럴 수 있으니 다시 시도해 주세요.'

export function useImageGeneration() {
	const [result, setResult] = useState<ImageGenerationResult | null>(null)
	const [requested, setRequested] = useState(0)
	const [selected, setSelected] = useState<number | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function generate(input: ImageGenerationRequest) {
		if (!input.prompt.trim() || loading) return

		setLoading(true)
		setError(null)
		setSelected(null)
		setRequested(input.count)

		try {
			const response = await fetch('/api/image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(input),
			})

			if (!response.ok) throw new Error(`생성 실패 (${response.status})`)
			setResult((await response.json()) as ImageGenerationResult)
		} catch (requestError) {
			console.error(requestError)
			setError(GENERATION_ERROR_MESSAGE)
		} finally {
			setLoading(false)
		}
	}

	return { error, generate, loading, requested, result, selected, setSelected }
}
