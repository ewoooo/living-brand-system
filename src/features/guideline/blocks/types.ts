import type { GuidelinePage } from '@/payload-types'

export type GuidelineBlock = NonNullable<GuidelinePage['blocks']>[number]

export interface RuleDerivation {
	rule: number
	evidence: string
	referenceAssets: number[]
}

/**
 * 블록 타입별 동작 계약. 새 블록 타입은 이 계약을 구현하는 모듈을 만들고 registry에 등록한다.
 * formatForAgent는 필수 — 모든 블록은 agent 컨텍스트로 읽혀야 한다.
 * deriveRules는 룰을 문서화하는 블록만 구현한다(가이드라인 블록이 SSOT, 룰은 파생물).
 */
export interface BlockBehavior {
	formatForAgent: (block: GuidelineBlock) => string
	deriveRules?: (block: GuidelineBlock) => RuleDerivation[]
}
