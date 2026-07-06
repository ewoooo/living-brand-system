'use client'

import { createContext, type ReactNode, useState } from 'react'
import type { CheckResult } from '@/features/review/checkers/types'
import { getReviewScenario, REVIEW_SCENARIOS } from '@/features/review/scenarios/review-scenarios'
import type { ImageContentFlags } from '@/features/review/types/content-flags'
import type { ReviewImage, ReviewImageContextValue } from '@/features/review/types/review-image'

export const ReviewImageContext = createContext<ReviewImageContextValue | null>(null)

/**
 * 검수 대상 이미지 목록·선택 상태·포함 요소 플래그를 review 작업 영역 전체에 제공한다.
 * 검수는 업로드/토글 시 자동 실행하지 않고 runReview(검수 버튼)로만 트리거한다.
 * 판정은 서버(/api/review/check)가 소유하고, 클라이언트는 미리보기(object URL)와 진행 표시만 담당한다.
 */
export function ReviewImageProvider({ children }: { children: ReactNode }) {
	const [images, setImages] = useState<ReviewImage[]>([])
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [contentFlags, setContentFlags] = useState<ImageContentFlags>({
		...REVIEW_SCENARIOS[0].flags,
	})
	const [scenarioKey, setScenarioKeyValue] = useState(REVIEW_SCENARIOS[0].key)
	const [flagsLocked, setFlagsLocked] = useState(false)
	// 개발 중(체커 없는) 룰은 기본 숨김.
	const [showUnimplemented, setShowUnimplemented] = useState(false)

	// 서버 확정 판정을 한 번에 받아 반영한다.
	async function runCheck(id: string, file: File, flags: ImageContentFlags) {
		setImages((prev) =>
			prev.map((image) =>
				image.id === id ? { ...image, checking: true, results: {} } : image,
			),
		)
		try {
			const form = new FormData()
			form.append('image', file)
			form.append('flags', JSON.stringify(flags))
			form.append('scenarioKey', scenarioKey)
			form.append('source', 'review-page')
			const response = await fetch('/api/review/check', { method: 'POST', body: form })
			if (!response.ok) throw new Error(`review check failed: ${response.status}`)
			const { checkSessionId, results } = (await response.json()) as {
				checkSessionId: number
				results: Record<string, CheckResult>
			}
			setImages((prev) =>
				prev.map((image) =>
					image.id === id ? { ...image, checkSessionId, results } : image,
				),
			)
		} catch {
			// 실패 시 결과 없이 종료 — 재검수는 검수 버튼으로 다시 트리거한다.
		} finally {
			setImages((prev) =>
				prev.map((image) => (image.id === id ? { ...image, checking: false } : image)),
			)
		}
	}

	function addFiles(files: FileList | File[]) {
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
	}

	function select(id: string) {
		setSelectedId(id)
	}

	function setContentFlag(key: keyof ImageContentFlags, value: boolean) {
		setContentFlags((prev) => ({ ...prev, [key]: value }))
	}

	function setScenarioKey(key: string) {
		const scenario = getReviewScenario(key)
		setScenarioKeyValue(scenario.key)
		setContentFlags({ ...scenario.flags })
	}

	function runReview() {
		if (!selectedId) return
		const target = images.find((image) => image.id === selectedId)
		if (!target) return
		setFlagsLocked(true)
		void runCheck(target.id, target.file, contentFlags)
	}

	const value: ReviewImageContextValue = {
		images,
		selectedId,
		selected: images.find((image) => image.id === selectedId) ?? null,
		select,
		addFiles,
		contentFlags,
		flagsLocked,
		setContentFlag,
		scenarioKey,
		setScenarioKey,
		runReview,
		showUnimplemented,
		setShowUnimplemented,
	}

	return <ReviewImageContext.Provider value={value}>{children}</ReviewImageContext.Provider>
}
