'use client'

import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import { useImageGeneration } from '@/features/generate-image/hooks/use-image-generation'
import type { ImageAspectRatio, ImageOutputSize } from '@/features/generate-image/image-size'
import type { ImageGenerationResult } from '@/features/generate-image/services/generate-image.client'
import { downloadImage } from '@/features/image-studio/download-image'
import type { ImageColorAdjustment } from '@/features/image-studio/image-colorize'
import type {
	ImageStudioConfig,
	ImageStudioProfileOption,
} from '@/features/image-studio/image-studio-config'

type ImageStudioValue = {
	profiles: {
		/** 프로파일 교체 후보 — 계약은 언제나 이 중 하나다. */
		options: ImageStudioProfileOption[]
		select: (profileId: number) => void
	}
	/** 현재 프로파일의 편집 계약 — 컨트롤러는 이 객체만 보고 컨트롤을 그린다. */
	config: ImageStudioConfig
	prompt: {
		value: string
		setValue: (text: string) => void
	}
	generation: {
		batch: number
		setBatch: (count: number) => void
		ratio: ImageAspectRatio
		setRatio: (ratio: ImageAspectRatio) => void
		resolution: ImageOutputSize
		setResolution: (resolution: ImageOutputSize) => void
		run: () => void
		busy: boolean
		error: string | null
	}
	color: {
		/** 색 조정 값 — 계약이 색을 열지 않으면 null이고, 그때는 색 행도 굽는 저장도 없다. */
		value: ImageColorAdjustment | null
		update: (patch: Partial<ImageColorAdjustment>) => void
	}
	camera: {
		azimuthDeg: number
		elevationDeg: number
		setAngles: (angles: { azimuthDeg: number; elevationDeg: number }) => void
		/** 시점을 다시 잡을 시드 — null이면 대상이 없다(컨트롤러가 섹션을 잠근다). */
		seedImage: string | null
		regenerate: () => void
	}
	results: {
		/** 직전 요청이 만든 결과 — 프로파일을 교체해도 유지된다(사용자가 만든 산출물). */
		result: ImageGenerationResult | null
		/** 요청한 장수 — 생성 중 자리표시자 개수. */
		requested: number
		selected: number | null
		select: (index: number | null) => void
	}
	/** PNG 저장 — 색이 있으면 구운 PNG, 없으면 원본이다. 서버에 남기지 않는다. */
	download: {
		selected: () => void
		all: () => void
	}
}

const ImageStudioContext = createContext<ImageStudioValue | null>(null)

/**
 * 이미지 스튜디오 편집 세션의 단일 소유자 — 컨트롤러(사이드바)와 결과 캔버스는 이 컨텍스트만
 * 알고 서로를 모른다. 조작 범위는 파생된 ImageStudioConfig 계약이 말하고, HTTP I/O는
 * features의 *.client.ts가 소유한다(docs/10 §3.5·§3.6).
 *
 * 프로파일 교체 정책: 어드민이 정의한 층만 새 프로파일로 갈아끼우고 사용자의 층은 남긴다 —
 * 프롬프트와 생성 결과는 유지하고, 계약이 정의한 선택은 새 선택지에 없을 때만 새 시작값으로
 * 되돌리며, 선택지 없는 프로파일 고유 값(색)은 언제나 새 계약의 기본값으로 되돌린다.
 */
export function ImageStudioProvider({
	configs,
	initialProfileId,
	children,
}: {
	configs: ImageStudioConfig[]
	initialProfileId?: number
	children: ReactNode
}) {
	const initial = configs.find(({ profileId }) => profileId === initialProfileId) ?? configs[0]
	if (!initial) {
		throw new Error('ImageStudioProvider는 계약이 최소 하나 있을 때만 사용할 수 있습니다.')
	}

	const [profileId, setProfileId] = useState(initial.profileId)
	const [prompt, setPrompt] = useState('')
	const [batch, setBatch] = useState(initial.generateOptions.batch.defaultValue)
	const [ratio, setRatio] = useState(initial.generateOptions.ratio.defaultValue)
	const [resolution, setResolution] = useState(initial.generateOptions.resolution.defaultValue)
	const [color, setColor] = useState<ImageColorAdjustment | null>(initial.colorAdjustment ?? null)
	const [angles, setAngles] = useState({ azimuthDeg: 0, elevationDeg: 0 })
	const { adjustCamera, error, generate, loading, requested, result, selected, setSelected } =
		useImageGeneration()

	const config = configs.find((item) => item.profileId === profileId) ?? initial
	// 카드가 배지를 계약에서 파생할 수 있게 개방 필드까지 실어 보낸다 — 원시 프로파일을 다시 조회하지 않는다.
	const options = useMemo(
		() =>
			configs.map(({ colorAdjustment, name, profileId: id, supportsCameraControl }) => ({
				colorAdjustment,
				name,
				profileId: id,
				supportsCameraControl,
			})),
		[configs],
	)

	function selectProfile(nextProfileId: number) {
		const next = configs.find((item) => item.profileId === nextProfileId)
		if (!next) return
		setProfileId(nextProfileId)
		// 색은 프로파일 고유 설정이라 언제나 새 계약의 기본값으로 되돌린다(선택지가 없어 유지할
		// 근거가 없다 — 앞 프로파일의 색을 남기면 다른 브랜드 색을 물려받은 것처럼 보인다).
		setColor(next.colorAdjustment ?? null)
		// 나머지는 새 프로파일이 지원하지 않는 선택만 시작값으로 되돌린다.
		const {
			batch: nextBatch,
			ratio: nextRatio,
			resolution: nextResolution,
		} = next.generateOptions
		if (!nextBatch.options.includes(batch)) setBatch(nextBatch.defaultValue)
		if (!nextRatio.options.includes(ratio)) setRatio(nextRatio.defaultValue)
		if (!nextResolution.options.includes(resolution)) setResolution(nextResolution.defaultValue)
	}

	// 시점 조정은 저장된 생성 이미지를 시드로 쓴다 — 셋(시드 URL·생성 이미지 id·프로파일)이
	// 모두 있을 때만 대상이 성립하므로 한 객체로 파생한다.
	const generatedImage = selected === null ? undefined : result?.generatedImages?.[selected]
	const cameraSeed =
		selected !== null && result?.profileId && generatedImage
			? {
					basePrompt: result.prompt,
					generatedImageId: generatedImage.id,
					profileId: result.profileId,
					src: result.images[selected],
				}
			: null

	const value: ImageStudioValue = {
		profiles: { options, select: selectProfile },
		config,
		prompt: { value: prompt, setValue: setPrompt },
		generation: {
			batch,
			setBatch,
			ratio,
			setRatio,
			resolution,
			setResolution,
			run: () =>
				void generate({
					aspectRatio: ratio,
					count: batch,
					imageSize: resolution,
					profileId: config.profileId,
					prompt,
				}),
			busy: loading,
			error,
		},
		color: {
			value: color,
			update: (patch) =>
				setColor((current) => (current ? { ...current, ...patch } : current)),
		},
		camera: {
			...angles,
			setAngles,
			seedImage: cameraSeed?.src ?? null,
			regenerate: () => {
				if (!cameraSeed) return
				void adjustCamera({
					basePrompt: cameraSeed.basePrompt,
					camera: angles,
					count: 1,
					generatedImageId: cameraSeed.generatedImageId,
					profileId: cameraSeed.profileId,
				})
			},
		},
		results: { result, requested, selected, select: setSelected },
		download: {
			selected: () => {
				const src = selected === null ? undefined : result?.images[selected]
				if (src && selected !== null) void downloadImage(src, selected, color)
			},
			// ponytail: 저장을 연달아 낸다 — 장수가 늘어 브라우저가 막으면 zip으로 올린다.
			// 색을 굽는 경로는 한 장에 캡처 한 번이라 순차로 기다린다.
			all: () => {
				void (async () => {
					for (const [index, src] of (result?.images ?? []).entries()) {
						await downloadImage(src, index, color)
					}
				})()
			},
		},
	}

	return <ImageStudioContext.Provider value={value}>{children}</ImageStudioContext.Provider>
}

export function useImageStudio() {
	const context = useContext(ImageStudioContext)
	if (!context) {
		throw new Error('useImageStudio는 ImageStudioProvider 안에서만 호출할 수 있습니다.')
	}
	return context
}
