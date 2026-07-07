import type { CheckResult } from '@/features/asset-check/checkers/types'

export interface ImageContentFlags {
	logo: boolean
	typography: boolean
	illustration: boolean
	photography: boolean
}

export const DEFAULT_CONTENT_FLAGS: ImageContentFlags = {
	logo: false,
	typography: false,
	illustration: false,
	photography: false,
}

export const CONTENT_FLAG_LABELS: Record<keyof ImageContentFlags, string> = {
	logo: 'Logo',
	typography: 'Typography',
	illustration: 'Illustration',
	photography: 'Photography',
}

export type CheckImageStatus = '대기' | '진행' | '완료'

export interface CheckImage {
	id: string
	url: string
	name: string
	checkSessionId?: number
	/** 서버 검수 요청에 보낼 원본 파일 */
	file: File
	/** ruleKey → 검수 결과 (검수된 룰만; 진행 중엔 일부만 채워짐) */
	results?: Record<string, CheckResult>
	pendingRuleKeys?: string[]
	status: CheckImageStatus
}

export interface CheckImageContextValue {
	images: CheckImage[]
	selectedId: string | null
	selected: CheckImage | null
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
	runCheck: () => void
}
