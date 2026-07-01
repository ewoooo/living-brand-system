'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
	activeRuleKeys,
	DEFAULT_CONTENT_FLAGS,
	type ImageContentFlags,
} from '@/features/review/content-gate'
import { loadPixelsFromUrl } from '@/features/review/extract-pixels.client'
import { type RuleOutcome, runCheckersProgressive } from '@/features/review/run-checkers'

export interface ReviewImage {
	id: string
	url: string
	name: string
	/** 유저가 선택한 콘텐츠 포함 여부 (사진 등). 활성 섹션·검수 대상을 결정한다. */
	contentFlags: ImageContentFlags
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
	/** 이미지의 사진 포함 여부를 토글하고, 활성 섹션 기준으로 재검수한다. */
	setPhoto: (id: string, photo: boolean) => void
}

const ReviewImageContext = createContext<ReviewImageContextValue | null>(null)

/**
 * 검수 대상 이미지 목록과 선택 상태를 review 작업 영역 전체에 제공한다.
 * 섹션(라우트)이 바뀌어도 선택 이미지가 유지되도록 layout 레벨에 둔다.
 * 미리보기는 브라우저 object URL만 쓰고(러프), 서버 업로드·검수는 별도 엔진이 담당한다.
 */
export function ReviewImageProvider({ children }: { children: React.ReactNode }) {
	const [images, setImages] = useState<ReviewImage[]>([])
	const [selectedId, setSelectedId] = useState<string | null>(null)

	// 활성 섹션(콘텐츠 플래그 기준)에 속한 룰만 순차 검수하고 결과를 점진 매핑한다.
	const runCheck = useCallback((id: string, url: string, flags: ImageContentFlags) => {
		const ruleKeys = activeRuleKeys(flags)
		loadPixelsFromUrl(url)
			.then(async (pixels) => {
				setImages((prev) =>
					prev.map((image) =>
						image.id === id ? { ...image, checking: true, results: {} } : image,
					),
				)
				await runCheckersProgressive(pixels, ruleKeys, (ruleKey, outcome) => {
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

	const addFiles = useCallback(
		(files: FileList | File[]) => {
			const added = Array.from(files)
				.filter((file) => file.type.startsWith('image/'))
				.map((file) => ({
					id: crypto.randomUUID(),
					url: URL.createObjectURL(file),
					name: file.name,
					contentFlags: DEFAULT_CONTENT_FLAGS,
				}))
			if (added.length === 0) return
			// 최신이 좌측으로 오도록 앞에 쌓는다
			setImages((prev) => [...added, ...prev])
			setSelectedId(added[0].id)
			// 업로드 즉시 기본(flat 가정) 활성 섹션 룰로 검수
			for (const item of added) {
				runCheck(item.id, item.url, item.contentFlags)
			}
		},
		[runCheck],
	)

	const select = useCallback((id: string) => setSelectedId(id), [])

	const setPhoto = useCallback(
		(id: string, photo: boolean) => {
			const target = images.find((image) => image.id === id)
			if (!target) return
			const nextFlags = { ...target.contentFlags, photo }
			setImages((prev) =>
				prev.map((image) =>
					image.id === id ? { ...image, contentFlags: nextFlags } : image,
				),
			)
			// 활성 섹션이 바뀌므로 재검수
			runCheck(id, target.url, nextFlags)
		},
		[images, runCheck],
	)

	const value = useMemo<ReviewImageContextValue>(
		() => ({
			images,
			selectedId,
			selected: images.find((image) => image.id === selectedId) ?? null,
			select,
			addFiles,
			setPhoto,
		}),
		[images, selectedId, select, addFiles, setPhoto],
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
