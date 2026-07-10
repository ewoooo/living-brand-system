import type { GuidelinePage } from '@/payload-types'

export type GuidelineBlock = NonNullable<GuidelinePage['blocks']>[number]

export interface CheckSourceSnapshot {
	evidence: string
	referenceAssets: number[]
}

/**
 * 블록 타입별 동작 계약. 새 블록 타입은 이 계약을 구현하는 모듈을 만들고 registry에 등록한다.
 * formatForAgent는 필수 — 모든 블록은 agent 컨텍스트로 읽혀야 한다.
 */
export interface BlockBehavior {
	formatForAgent: (block: GuidelineBlock) => string
	toCheckSourceSnapshot: (block: GuidelineBlock) => CheckSourceSnapshot
}
