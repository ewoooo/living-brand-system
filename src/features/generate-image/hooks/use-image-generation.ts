'use client'

import { useState } from 'react'
import {
	type ImageGenerationRequest,
	type ImageGenerationResult,
	requestImageGeneration,
} from '../services/generate-image.client'

const GENERATION_ERROR_MESSAGE = '이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요.'

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
			setResult(await requestImageGeneration(input))
		} catch (requestError) {
			console.error(requestError)
			setError(GENERATION_ERROR_MESSAGE)
		} finally {
			setLoading(false)
		}
	}

	return { error, generate, loading, requested, result, selected, setSelected }
}
