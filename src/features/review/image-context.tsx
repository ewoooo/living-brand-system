'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { loadPixelsFromUrl } from '@/features/review/extract-pixels.client'
import { runCheckers, type RuleOutcome } from '@/features/review/run-checkers'

export interface ReviewImage {
	id: string
	url: string
	name: string
	/** ruleKey → 검수 결과 (checker 있는 룰만; 없으면 화면에서 "미개발") */
	results?: Record<string, RuleOutcome>
}

interface ReviewImageContextValue {
	images: ReviewImage[]
	selectedId: string | null
	selected: ReviewImage | null
	select: (id: string) => void
	addFiles: (files: FileList | File[]) => void
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
		// 업로드 즉시 클라이언트 검수 → 이미지별 결과 매핑 (API 없이 review에서 바로)
		for (const item of added) {
			loadPixelsFromUrl(item.url)
				.then((pixels) => {
					const results = runCheckers(pixels)
					setImages((prev) =>
						prev.map((image) => (image.id === item.id ? { ...image, results } : image)),
					)
				})
				.catch(() => {})
		}
	}, [])

	const select = useCallback((id: string) => setSelectedId(id), [])

	const value = useMemo<ReviewImageContextValue>(
		() => ({
			images,
			selectedId,
			selected: images.find((image) => image.id === selectedId) ?? null,
			select,
			addFiles,
		}),
		[images, selectedId, select, addFiles],
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
