'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { ImageAspectRatio } from '@/features/generate-image/image-size'
import {
	type ImageProfileOption,
	requestImageGeneration,
	requestPublishedImageProfiles,
} from '@/features/generate-image/services/generate-image.client'

const GENERATION_ERROR_MESSAGE = '이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요.'

/**
 * 제작자가 스튜디오에 개방한 프레임 이미지 슬롯 — 프롬프트로 생성해 프레임 이미지를 교체한다.
 * 프로파일이 고정되지 않은 슬롯만 발행된 프로파일 목록을 불러와 선택을 노출한다.
 */
export function ImageSlotInput({
	id,
	pinnedProfileId,
	aspectRatio,
	onGenerated,
}: {
	id: string
	pinnedProfileId?: number
	/** 슬롯 박스에서 유도한 생성 비율 — 없으면 프로파일 비율로 생성한다. */
	aspectRatio?: ImageAspectRatio
	onGenerated: (image: { backgroundImage: string; generatedImageId: number }) => void
}) {
	const [prompt, setPrompt] = useState('')
	const [profiles, setProfiles] = useState<ImageProfileOption[] | null>(null)
	const [profileId, setProfileId] = useState<number | undefined>(pinnedProfileId)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (pinnedProfileId) return
		void requestPublishedImageProfiles()
			.then((nextProfiles) => {
				setProfiles(nextProfiles)
				setProfileId((current) => current ?? nextProfiles[0]?.id)
			})
			.catch(() => {
				setProfiles([])
				setError('이미지 프로파일을 불러오지 못했습니다.')
			})
	}, [pinnedProfileId])

	async function run() {
		const trimmed = prompt.trim()
		if (!trimmed || !profileId || loading) return
		setLoading(true)
		setError(null)
		try {
			const result = await requestImageGeneration({
				prompt: trimmed,
				count: 1,
				profileId,
				aspectRatio,
			})
			const generated = result.generatedImages?.[0]
			if (generated) {
				onGenerated({ backgroundImage: generated.url, generatedImageId: generated.id })
			} else {
				setError(GENERATION_ERROR_MESSAGE)
			}
		} catch (requestError) {
			console.error(requestError)
			setError(GENERATION_ERROR_MESSAGE)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex flex-col gap-2">
			{!pinnedProfileId && (
				<select
					aria-label="이미지 프로파일"
					value={profileId ?? ''}
					onChange={(event) => setProfileId(Number(event.currentTarget.value))}
					className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
				>
					{profiles?.length ? (
						profiles.map(({ id: optionId, name }) => (
							<option key={optionId} value={optionId}>
								{name}
							</option>
						))
					) : (
						<option value="" disabled>
							{profiles ? '발행된 프로파일 없음' : '프로파일 불러오는 중'}
						</option>
					)}
				</select>
			)}
			{aspectRatio && (
				<p className="font-body text-xs font-normal text-muted-foreground">
					슬롯 비율 {aspectRatio}로 생성
				</p>
			)}
			<Textarea
				id={id}
				value={prompt}
				onChange={(event) => setPrompt(event.target.value)}
				placeholder="만들 이미지를 설명하세요"
				maxLength={500}
				rows={2}
			/>
			<Button
				type="button"
				size="sm"
				onClick={run}
				disabled={loading || !profileId || !prompt.trim()}
			>
				{loading ? '생성 중…' : '이미지 생성'}
			</Button>
			{error && (
				<p role="alert" className="font-body text-sm font-normal text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}
