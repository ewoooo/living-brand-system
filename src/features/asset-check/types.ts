import type { CheckResult } from '@/features/asset-check/checkers/types'
import type { CheckSessionStatus } from '@/features/asset-check/domain/check-session'
import type { RuntimeCheck } from '@/features/asset-check/domain/runtime-check'
import type { CheckScenario } from '@/features/quality-rule/check-scenario'

export type { CheckSessionSource } from '@/features/asset-check/domain/check-session'

export type CheckImageStatus = CheckSessionStatus | 'idle'

export interface CheckImage {
	id: string
	url: string
	name: string
	checkSessionId?: number
	/** 이 이미지에 선택된 검수 시나리오 */
	scenarioKey: string
	/** 서버 검수 요청에 보낼 원본 파일 */
	file: File
	/** checkKey → 검수 결과 (검수된 Check만; 진행 중엔 일부만 채워짐) */
	results?: Record<string, CheckResult>
	pendingCheckKeys?: string[]
	/** 검수 세션 시작 시 저장된 룰 정의. 결과 근거와 기준값은 이 스냅샷에서 표시한다. */
	rulesetSnapshot?: RuntimeCheck[]
	status: CheckImageStatus
}

export interface CheckImageContextValue {
	scenarios: CheckScenario[]
	images: CheckImage[]
	selectedId: string | null
	selected: CheckImage | null
	select: (id: string) => void
	addFiles: (files: FileList | File[]) => void
	scenarioKey: string
	/** imageId를 생략하면 선택 이미지에 적용한다 — 시나리오는 이미지마다 다를 수 있다. */
	setScenarioKey: (key: string, imageId?: string) => void
	showFailOnly: boolean
	toggleFailOnly: () => void
	/** 선택 이미지를 검수 실행한다. */
	runCheck: () => void
	/** 모든 이미지를 순차로 검수 실행한다. */
	runAllChecks: () => void
	/** 근거 패널이 펼친 룰의 checkKey. 파일을 옮기면 해제된다. */
	selectedRuleKey: string | null
	selectRule: (checkKey: string | null) => void
}
