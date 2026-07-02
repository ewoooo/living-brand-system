'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
	activeRuleKeys,
	DEFAULT_CONTENT_FLAGS,
	type ImageContentFlags,
} from '@/features/review/content-gate'
import { loadPixelGridFromUrl, opaquePixels } from '@/features/review/extract-pixels.client'
import { type RuleOutcome, runCheckersProgressive } from '@/features/review/run-checkers'

export interface ReviewImage {
	id: string
	url: string
	name: string
	/** ruleKey → 검수 결과 (검수된 룰만; 진행 중엔 일부만 채워짐) */
	results?: Record<string, RuleOutcome>
	/** 검수 진행 중 여부 */
	checking?: boolean
}

interface ReviewImageContextValue {
	images: ReviewImage[]
	selectedId: string | null
	selected: ReviewImage | null
	select: (id: string) => void
	addFiles: (files: FileList | File[]) => void
	/** 포함 요소 플래그 (워크스페이스 수준). 검수 대상 섹션을 결정한다. */
	contentFlags: ImageContentFlags
	/** 검수 제출 후 true — 플래그 잠금. 새 이미지 업로드 시 다시 false. */
	flagsLocked: boolean
	/** 포함 요소 토글 (재검수하지 않음 — 검수는 runReview로만). */
	setContentFlag: (key: keyof ImageContentFlags, value: boolean) => void
	/** 선택 이미지를 현재 플래그로 검수 실행하고 플래그를 잠근다. */
	runReview: () => void
}

const ReviewImageContext = createContext<ReviewImageContextValue | null>(null)

/**
 * 검수 대상 이미지 목록·선택 상태·포함 요소 플래그를 review 작업 영역 전체에 제공한다.
 * 검수는 업로드/토글 시 자동 실행하지 않고 runReview(검수 버튼)로만 트리거한다.
 * 미리보기는 브라우저 object URL만 쓰고(러프), 서버 업로드·검수는 별도 엔진이 담당한다.
 */
export function ReviewImageProvider({ children }: { children: React.ReactNode }) {
	const [images, setImages] = useState<ReviewImage[]>([])
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [contentFlags, setContentFlags] = useState<ImageContentFlags>(DEFAULT_CONTENT_FLAGS)
	const [flagsLocked, setFlagsLocked] = useState(false)

	// 활성 섹션(플래그 기준)에 속한 룰만 순차 검수하고 결과를 점진 매핑한다.
	const runCheck = useCallback((id: string, url: string, flags: ImageContentFlags) => {
		const ruleKeys = activeRuleKeys(flags)
		loadPixelGridFromUrl(url)
			.then(async (grid) => {
				const pixels = opaquePixels(grid)
				setImages((prev) =>
					prev.map((image) =>
						image.id === id ? { ...image, checking: true, results: {} } : image,
					),
				)
				await runCheckersProgressive(pixels, grid, ruleKeys, (ruleKey, outcome) => {
					setImages((prev) =>
						prev.map((image) =>
							image.id === id
								? { ...image, results: { ...image.results, [ruleKey]: outcome } }
								: image,
						),
					)
				})
				setImages((prev) =>
					prev.map((image) => (image.id === id ? { ...image, checking: false } : image)),
				)
			})
			.catch(() => {})
	}, [])

	const addFiles = useCallback((files: FileList | File[]) => {
		const added = Array.from(files)
			.filter((file) => file.type.startsWith('image/'))
			.map((file) => ({
				id: crypto.randomUUID(),
				url: URL.createObjectURL(file),
				name: file.name,
			}))
		if (added.length === 0) return
		// 최신이 좌측으로 오도록 앞에 쌓는다
		setImages((prev) => [...added, ...prev])
		setSelectedId(added[0].id)
		// 새 이미지 업로드 → 플래그 재활성화. 검수는 자동 실행하지 않고 버튼으로만 한다.
		setFlagsLocked(false)
	}, [])

	const select = useCallback((id: string) => setSelectedId(id), [])

	const setContentFlag = useCallback((key: keyof ImageContentFlags, value: boolean) => {
		// 워크스페이스 플래그만 갱신 — 재검수 없음.
		setContentFlags((prev) => ({ ...prev, [key]: value }))
	}, [])

	const runReview = useCallback(() => {
		if (!selectedId) return
		const target = images.find((image) => image.id === selectedId)
		if (!target) return
		setFlagsLocked(true)
		runCheck(target.id, target.url, contentFlags)
	}, [selectedId, images, contentFlags, runCheck])

	const value = useMemo<ReviewImageContextValue>(
		() => ({
			images,
			selectedId,
			selected: images.find((image) => image.id === selectedId) ?? null,
			select,
			addFiles,
			contentFlags,
			flagsLocked,
			setContentFlag,
			runReview,
		}),
		[
			images,
			selectedId,
			select,
			addFiles,
			contentFlags,
			flagsLocked,
			setContentFlag,
			runReview,
		],
	)

	return <ReviewImageContext.Provider value={value}>{children}</ReviewImageContext.Provider>
}

export function useReviewImages() {
	const context = useContext(ReviewImageContext)
	if (!context) {
		throw new Error('useReviewImages must be used within ReviewImageProvider')
	}
	return context
}
