'use client'

import { ChevronDown } from '@carbon/icons-react'
import { useEffect, useState } from 'react'
import {
	InspectorColorRow,
	InspectorField,
	InspectorRow,
} from '@/components/studio/shared/inspector'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Typography } from '@/components/ui/typography'
import type { ImageAspectRatio } from '@/features/generate-image/image-size'
import {
	type ImageProfileOption,
	requestImageGeneration,
	requestPublishedImageProfiles,
} from '@/features/generate-image/services/generate-image.client'

const GENERATION_ERROR_MESSAGE = '이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요.'

type ImageSlotInputProps = {
	id: string
	pinnedProfileId?: number
	/** 슬롯 박스에서 유도한 생성 비율 — 없으면 프로파일 비율로 생성한다. */
	aspectRatio?: ImageAspectRatio
	/** 저작 config(imageColorize)의 선화 색 — Line Color 행의 초기값. */
	defaultLineColor?: string
	onGenerated: (image: { backgroundImage: string; generatedImageId: number }) => void
}

/**
 * 제작자가 스튜디오에 개방한 프레임 이미지 슬롯 — 프롬프트로 생성해 프레임 이미지를 교체한다.
 * 프로파일이 고정된 슬롯은 Type 행을 읽기 전용으로 보여주고, 아니면 발행 프로파일 선택을 노출한다.
 */
export function ImageSlotInput({
	id,
	pinnedProfileId,
	aspectRatio,
	defaultLineColor,
	onGenerated,
}: ImageSlotInputProps) {
	const [prompt, setPrompt] = useState('')
	const [profiles, setProfiles] = useState<ImageProfileOption[] | null>(null)
	const [profileId, setProfileId] = useState<number | undefined>(pinnedProfileId)
	// ponytail: UI-first 컨트롤 — 아직 compose의 imageColorize 오버라이드에 연결되지 않는다(2단계).
	const [lineColor, setLineColor] = useState(defaultLineColor ?? '#000000')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// 고정 슬롯도 목록을 불러온다 — Type 행에 프로파일 이름을 보여주기 위해서다.
	// 고정 슬롯은 목록 없이도 생성이 가능하므로 로드 실패를 오류로 올리지 않는다.
	useEffect(() => {
		void requestPublishedImageProfiles()
			.then((nextProfiles) => {
				setProfiles(nextProfiles)
				if (!pinnedProfileId) setProfileId((current) => current ?? nextProfiles[0]?.id)
			})
			.catch(() => {
				setProfiles([])
				if (!pinnedProfileId) setError('이미지 프로파일을 불러오지 못했습니다.')
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

	const pinnedProfileName = profiles?.find((profile) => profile.id === pinnedProfileId)?.name

	return (
		<div data-slot="image-slot-input" className="flex flex-col gap-1">
			{pinnedProfileId ? (
				<InspectorRow label="Type" className="opacity-50">
					<span className="flex min-w-0 items-center gap-2">
						<span className="truncate text-sm text-muted-foreground">
							{pinnedProfileName ?? '—'}
						</span>
						<ChevronDown
							aria-hidden
							className="size-4 shrink-0 text-muted-foreground"
						/>
					</span>
				</InspectorRow>
			) : (
				<InspectorRow label="Type" htmlFor={`${id}-profile`}>
					<Select
						value={profileId ? String(profileId) : undefined}
						onValueChange={(value) => setProfileId(Number(value))}
						disabled={!profiles?.length}
					>
						<SelectTrigger
							id={`${id}-profile`}
							size="sm"
							className="h-auto border-transparent bg-transparent p-0 text-muted-foreground focus-visible:ring-0 dark:bg-transparent"
						>
							<SelectValue
								placeholder={
									profiles ? '발행된 프로파일 없음' : '프로파일 불러오는 중'
								}
							/>
						</SelectTrigger>
						{profiles?.length ? (
							<SelectContent align="end">
								<SelectGroup>
									{profiles.map(({ id: optionId, name }) => (
										<SelectItem key={optionId} value={String(optionId)}>
											{name}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						) : null}
					</Select>
				</InspectorRow>
			)}
			<InspectorColorRow label="Line Color" value={lineColor} onChange={setLineColor} />
			<InspectorField label="Prompt" htmlFor={id} className="min-h-24">
				<Textarea
					id={id}
					value={prompt}
					onChange={(event) => setPrompt(event.target.value)}
					placeholder="만들 이미지를 설명하세요"
					maxLength={500}
					rows={2}
					className="h-auto min-h-12 rounded-none border-0 bg-transparent p-0 focus-visible:ring-0 dark:bg-transparent"
				/>
				{aspectRatio && (
					<Typography size="xs" tone="muted">
						슬롯 비율 {aspectRatio}로 생성
					</Typography>
				)}
			</InspectorField>
			<Button
				type="button"
				variant="muted"
				className="mt-0.5 h-11 w-full text-sm font-semibold"
				onClick={run}
				disabled={loading || !profileId || !prompt.trim()}
			>
				{loading ? '생성 중…' : '이미지 생성'}
			</Button>
			{error && <FieldError>{error}</FieldError>}
		</div>
	)
}
