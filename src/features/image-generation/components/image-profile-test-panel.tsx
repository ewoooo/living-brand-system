'use client'

import { Button, useForm } from '@payloadcms/ui'
import { useState } from 'react'
import { generateImages } from '@/features/image-generation/services/generate-image.client'

type PromptResult = {
	finalPrompt: Record<string, string>
	normalizedInput: Record<string, string>
}

export default function ImageProfileTestPanel() {
	const { getData } = useForm()
	const [userPrompt, setUserPrompt] = useState('')
	const [result, setResult] = useState<PromptResult | null>(null)
	const [image, setImage] = useState<string | null>(null)
	const [error, setError] = useState('')
	const [isNormalizing, setIsNormalizing] = useState(false)
	const [isGenerating, setIsGenerating] = useState(false)

	async function normalizeCurrentForm(): Promise<PromptResult> {
		const data = getData()
		const response = await fetch('/api/image-profiles/normalize', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				profilePrompt: data.profilePrompt,
				userPromptNormalization: data.userPromptNormalization,
				userPrompt,
			}),
		})
		const body = (await response.json().catch(() => null)) as
			| (PromptResult & { message?: string })
			| null
		if (!response.ok || !body?.finalPrompt) {
			throw new Error(body?.message || '프롬프트 정규화에 실패했습니다.')
		}
		const next = {
			finalPrompt: body.finalPrompt,
			normalizedInput: body.normalizedInput,
		}
		setResult(next)
		return next
	}

	async function handleNormalize() {
		if (!userPrompt.trim()) return
		setError('')
		setImage(null)
		setIsNormalizing(true)
		try {
			await normalizeCurrentForm()
		} catch (requestError) {
			setError(
				requestError instanceof Error ? requestError.message : '정규화에 실패했습니다.',
			)
		} finally {
			setIsNormalizing(false)
		}
	}

	async function handleGenerate() {
		if (!userPrompt.trim()) return
		setError('')
		setImage(null)
		setIsGenerating(true)
		try {
			const { finalPrompt } = await normalizeCurrentForm()
			const generated = await generateImages({
				count: 1,
				prompt: JSON.stringify(finalPrompt),
			})
			setImage(generated.images[0] ?? null)
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? requestError.message
					: '이미지 생성에 실패했습니다.',
			)
		} finally {
			setIsGenerating(false)
		}
	}

	const busy = isNormalizing || isGenerating

	return (
		<section className="image-profile-test-panel" aria-busy={busy}>
			<h3>생성 테스트</h3>
			<p>
				현재 폼 값을 사용합니다. 저장하지 않은 변경도 테스트할 수 있으며, 테스트 결과는
				저장되지 않습니다.
			</p>
			<label htmlFor="image-profile-user-prompt">유저 인풋 프롬프트</label>
			<textarea
				id="image-profile-user-prompt"
				value={userPrompt}
				onChange={(event) => {
					setUserPrompt(event.currentTarget.value)
					setResult(null)
					setImage(null)
				}}
				maxLength={500}
				rows={4}
			/>
			<div className="image-profile-test-panel__actions">
				<Button
					buttonStyle="secondary"
					disabled={busy || !userPrompt.trim()}
					margin={false}
					onClick={handleNormalize}
					type="button"
				>
					{isNormalizing ? '정규화 중…' : '최종 JSON 확인'}
				</Button>
				<Button
					disabled={busy || !userPrompt.trim()}
					margin={false}
					onClick={handleGenerate}
					type="button"
				>
					{isGenerating ? '생성 중…' : '이미지 생성'}
				</Button>
			</div>
			{error ? <p role="alert">{error}</p> : null}
			{result ? (
				<div className="image-profile-test-panel__json">
					<h3>최종 프롬프트 JSON</h3>
					<p>같은 주제는 유저 프롬프트가 시스템 프롬프트를 덮어씁니다.</p>
					<pre>{JSON.stringify(result.finalPrompt, null, 2)}</pre>
				</div>
			) : null}
			{image ? (
				<div className="image-profile-test-panel__result">
					{/* biome-ignore lint/performance/noImgElement: 생성 직후 data URI 미리보기 */}
					<img src={image} alt="이미지 프로파일 생성 테스트 결과" />
				</div>
			) : null}
		</section>
	)
}
