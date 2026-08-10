'use client'

import { ChevronDown } from '@carbon/icons-react'
import { useEffect, useState } from 'react'
import {
	INSPECTOR_BARE_INPUT,
	INSPECTOR_ROW_SELECT_TRIGGER,
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
} from '@/features/generate-image/services/generate-image.client'
import { cn } from '@/lib/utils'

const GENERATION_ERROR_MESSAGE = '이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요.'
const PROMPT_MAX_LENGTH = 500

type ImageSlotInputProps = {
	id: string
	pinnedProfileId?: number
	/** 슬롯 박스에서 유도한 생성 비율 — 없으면 프로파일 비율로 생성한다. */
	aspectRatio?: ImageAspectRatio
	/** 발행 프로파일 목록 — generator가 1회 조회해 모든 슬롯이 공유한다. null = 로드 중. */
	profiles: ImageProfileOption[] | null
	/** 목록 로드 실패 — 고정 슬롯은 목록 없이도 생성 가능하므로 미고정 슬롯에서만 오류로 보여준다. */
	profilesFailed?: boolean
	/** 저작 colorize가 있는 슬롯만 Line Color가 실제로 반영된다 — 없으면 행을 그리지 않는다. */
	colorizeEnabled?: boolean
	/** Line Color 행의 표시 값 — 소유는 generator(합성 오버라이드에 쓴다). */
	lineColor: string
	onLineColorChange: (hex: string) => void
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
	profiles,
	profilesFailed,
	colorizeEnabled,
	lineColor,
	onLineColorChange,
	onGenerated,
}: ImageSlotInputProps) {
	const [prompt, setPrompt] = useState('')
	const [profileId, setProfileId] = useState<number | undefined>(pinnedProfileId)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// 미고정 슬롯은 목록이 도착하면 첫 프로파일을 기본 선택한다.
	useEffect(() => {
		if (!pinnedProfileId && profiles?.length) {
			setProfileId((current) => current ?? profiles[0]?.id)
		}
	}, [pinnedProfileId, profiles])

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
	const visibleError =
		error ??
		(!pinnedProfileId && profilesFailed ? '이미지 프로파일을 불러오지 못했습니다.' : null)

	return (
		<div data-slot="image-slot-input" className="flex flex-col gap-1">
			{pinnedProfileId ? (
				<InspectorRow label="Type">
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
							className={INSPECTOR_ROW_SELECT_TRIGGER}
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
			{colorizeEnabled && (
				<InspectorColorRow
					label="Line Color"
					value={lineColor}
					onChange={onLineColorChange}
				/>
			)}
			<InspectorField
				label="Prompt"
				htmlFor={id}
				counter={`${prompt.length}/${PROMPT_MAX_LENGTH}`}
				className="min-h-24"
			>
				<Textarea
					id={id}
					value={prompt}
					onChange={(event) => setPrompt(event.target.value)}
					placeholder="만들 이미지를 설명하세요"
					maxLength={PROMPT_MAX_LENGTH}
					rows={2}
					className={cn(INSPECTOR_BARE_INPUT, 'min-h-12')}
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
			{visibleError && <FieldError>{visibleError}</FieldError>}
		</div>
	)
}
