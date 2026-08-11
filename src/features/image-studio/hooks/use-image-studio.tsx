'use client'

import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import { useImageGeneration } from '@/features/generate-image/hooks/use-image-generation'
import type { ImageGenerationResult } from '@/features/generate-image/services/generate-image.client'
import type { ImageStudioConfig } from '@/features/image-studio/image-studio-config'

type ImageStudioValue = {
	profiles: {
		/** 프로파일 교체 후보 — 계약은 언제나 이 중 하나다. */
		options: { id: number; name: string }[]
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
		run: () => void
		busy: boolean
		error: string | null
	}
	results: {
		/** 직전 요청이 만든 결과 — 프로파일을 교체해도 유지된다(사용자가 만든 산출물). */
		result: ImageGenerationResult | null
		/** 요청한 장수 — 생성 중 자리표시자 개수. */
		requested: number
		selected: number | null
		select: (index: number | null) => void
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
 * 되돌린다.
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
	const { error, generate, loading, requested, result, selected, setSelected } =
		useImageGeneration()

	const config = configs.find((item) => item.profileId === profileId) ?? initial
	const options = useMemo(
		() => configs.map(({ profileId: id, name }) => ({ id, name })),
		[configs],
	)

	function selectProfile(nextProfileId: number) {
		const next = configs.find((item) => item.profileId === nextProfileId)
		if (!next) return
		setProfileId(nextProfileId)
		// 새 프로파일이 지원하지 않는 선택만 시작값으로 되돌린다.
		if (!next.generateOptions.batch.options.includes(batch)) {
			setBatch(next.generateOptions.batch.defaultValue)
		}
	}

	const value: ImageStudioValue = {
		profiles: { options, select: selectProfile },
		config,
		prompt: { value: prompt, setValue: setPrompt },
		generation: {
			batch,
			setBatch,
			run: () => void generate({ count: batch, prompt, profileId: config.profileId }),
			busy: loading,
			error,
		},
		results: { result, requested, selected, select: setSelected },
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
