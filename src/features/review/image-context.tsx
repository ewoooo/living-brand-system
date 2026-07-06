'use client'

import { createContext, use, useCallback, useMemo, useState } from 'react'
import { DEFAULT_CONTENT_FLAGS, type ImageContentFlags } from '@/features/review/content-gate'
import type { RuleOutcome } from '@/features/review/services/run-review.service'

export interface ReviewImage {
	id: string
	url: string
	name: string
	/** 서버 검수 요청에 보낼 원본 파일 */
	file: File
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
	/** 포함 요소 플래그 (현재 검수 로직엔 미반영 — 향후 사용 대비 유지). */
	contentFlags: ImageContentFlags
	/** 검수 제출 후 true — 플래그 잠금. 새 이미지 업로드 시 다시 false. */
	flagsLocked: boolean
	setContentFlag: (key: keyof ImageContentFlags, value: boolean) => void
	/** 선택 이미지를 검수 실행하고 플래그를 잠근다. */
	runReview: () => void
	/** 개발 중(체커 없는) 룰 표시 여부. 기본 숨김(false). */
	showUnimplemented: boolean
	setShowUnimplemented: (value: boolean) => void
}

const ReviewImageContext = createContext<ReviewImageContextValue | null>(null)

/**
 * 검수 대상 이미지 목록·선택 상태·포함 요소 플래그를 review 작업 영역 전체에 제공한다.
 * 검수는 업로드/토글 시 자동 실행하지 않고 runReview(검수 버튼)로만 트리거하며, 전 룰을 대상으로 한다.
 * 판정은 서버(/api/review/check)가 소유하고, 클라이언트는 미리보기(object URL)와 진행 표시만 담당한다.
 */
export function ReviewImageProvider({ children }: { children: React.ReactNode }) {
	const [images, setImages] = useState<ReviewImage[]>([])
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [contentFlags, setContentFlags] = useState<ImageContentFlags>(DEFAULT_CONTENT_FLAGS)
	const [flagsLocked, setFlagsLocked] = useState(false)
	// 개발 중(체커 없는) 룰은 기본 숨김.
	const [showUnimplemented, setShowUnimplemented] = useState(false)

	// 서버 확정 판정을 한 번에 받아 반영한다.
	const runCheck = useCallback(async (id: string, file: File) => {
		setImages((prev) =>
			prev.map((image) =>
				image.id === id ? { ...image, checking: true, results: {} } : image,
			),
		)
		try {
			const form = new FormData()
			form.append('image', file)
			const response = await fetch('/api/review/check', { method: 'POST', body: form })
			if (!response.ok) throw new Error(`review check failed: ${response.status}`)
			const { results } = (await response.json()) as { results: Record<string, RuleOutcome> }
			setImages((prev) =>
				prev.map((image) => (image.id === id ? { ...image, results } : image)),
			)
		} catch {
			// 실패 시 결과 없이 종료 — 재검수는 검수 버튼으로 다시 트리거한다.
		} finally {
			setImages((prev) =>
				prev.map((image) => (image.id === id ? { ...image, checking: false } : image)),
			)
		}
	}, [])

	const addFiles = useCallback((files: FileList | File[]) => {
		const added: ReviewImage[] = []
		for (const file of files) {
			if (!file.type.startsWith('image/')) continue
			added.push({
				id: crypto.randomUUID(),
				url: URL.createObjectURL(file),
				name: file.name,
				file,
			})
		}
		if (added.length === 0) return
		// 최신이 좌측으로 오도록 앞에 쌓는다
		setImages((prev) => [...added, ...prev])
		setSelectedId(added[0].id)
		// 새 이미지 업로드 → 플래그 재활성화. 검수는 자동 실행하지 않고 버튼으로만 한다.
		setFlagsLocked(false)
	}, [])

	const select = useCallback((id: string) => setSelectedId(id), [])

	const setContentFlag = useCallback((key: keyof ImageContentFlags, value: boolean) => {
		setContentFlags((prev) => ({ ...prev, [key]: value }))
	}, [])

	const runReview = useCallback(() => {
		if (!selectedId) return
		const target = images.find((image) => image.id === selectedId)
		if (!target) return
		setFlagsLocked(true)
		void runCheck(target.id, target.file)
	}, [selectedId, images, runCheck])

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
			showUnimplemented,
			setShowUnimplemented,
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
			showUnimplemented,
		],
	)

	return <ReviewImageContext.Provider value={value}>{children}</ReviewImageContext.Provider>
}

export function useReviewImages() {
	const context = use(ReviewImageContext)
	if (!context) {
		throw new Error('useReviewImages must be used within ReviewImageProvider')
	}
	return context
}
