import type { CheckResult } from '@/features/asset-check/checkers/types'

export interface ImageContentFlags {
	logo: boolean
	typography: boolean
	illustration: boolean
	photography: boolean
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
	scenarioKey: string
	setScenarioKey: (key: string) => void
	/** 선택 이미지를 검수 실행한다. */
	runCheck: () => void
}
