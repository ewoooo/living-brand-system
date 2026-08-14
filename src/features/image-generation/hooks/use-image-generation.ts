'use client'

import { useCallback, useState } from 'react'
import type { CameraAdjustmentRequest } from '../camera-control'
import {
	type ImageGenerationRequest,
	type ImageGenerationResult,
	requestCameraAdjustment,
	requestImageGeneration,
} from '../services/generate-image.client'

const GENERATION_ERROR_MESSAGE = '이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요.'
const CAMERA_ERROR_MESSAGE = '시점 조정에 실패했어요. 잠시 후 다시 시도해 주세요.'

export function useImageGeneration() {
	const [result, setResult] = useState<ImageGenerationResult | null>(null)
	const [requested, setRequested] = useState(0)
	const [selected, setSelected] = useState<number | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const run = useCallback(
		async (
			count: number,
			request: () => Promise<ImageGenerationResult>,
			errorMessage: string,
		) => {
			if (loading) return

			setLoading(true)
			setError(null)
			setSelected(null)
			setRequested(count)

			try {
				setResult(await request())
			} catch (requestError) {
				console.error(requestError)
				setError(requestError instanceof Error ? requestError.message : errorMessage)
			} finally {
				setLoading(false)
			}
		},
		[loading],
	)

	const generate = useCallback(
		async (input: ImageGenerationRequest) => {
			if (!input.prompt.trim()) return
			await run(input.count, () => requestImageGeneration(input), GENERATION_ERROR_MESSAGE)
		},
		[run],
	)

	/** 선택한 생성 이미지를 시드로 시점을 다시 잡는다 — 조정 결과도 같은 결과 상태로 흐른다. */
	const adjustCamera = useCallback(
		async (input: CameraAdjustmentRequest) => {
			await run(1, () => requestCameraAdjustment(input), CAMERA_ERROR_MESSAGE)
		},
		[run],
	)

	return { adjustCamera, error, generate, loading, requested, result, selected, setSelected }
}
