import type { Dispatch, SetStateAction } from 'react'
import type { CheckResult } from '@/features/review/checkers/types'
import type { ImageContentFlags } from '@/features/review/types/content-flags'

export interface ReviewImage {
	id: string
	url: string
	name: string
	checkSessionId?: number
	/** 서버 검수 요청에 보낼 원본 파일 */
	file: File
	/** ruleKey → 검수 결과 (검수된 룰만; 진행 중엔 일부만 채워짐) */
	results?: Record<string, CheckResult>
	/** 검수 진행 중 여부 */
	checking?: boolean
}

export interface ReviewImageContextValue {
	images: ReviewImage[]
	selectedId: string | null
	selected: ReviewImage | null
	select: (id: string) => void
	addFiles: (files: FileList | File[]) => void
	/** 포함 요소 플래그 — 검수 요청에 실려 서버가 요소 종속 룰 실행 여부를 정한다. */
	contentFlags: ImageContentFlags
	/** 검수 제출 후 true — 플래그 잠금. 새 이미지 업로드 시 다시 false. */
	flagsLocked: boolean
	setContentFlag: (key: keyof ImageContentFlags, value: boolean) => void
	scenarioKey: string
	setScenarioKey: (key: string) => void
	/** 선택 이미지를 검수 실행하고 플래그를 잠근다. */
	runReview: () => void
	/** 개발 중(체커 없는) 룰 표시 여부. 기본 숨김(false). */
	showUnimplemented: boolean
	setShowUnimplemented: Dispatch<SetStateAction<boolean>>
}
