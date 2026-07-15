import type { GuidelineDocument } from '@/payload-types'

export type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]

export type CheckReferenceAssetRole = 'positive' | 'negative' | 'context'

export interface CheckReferenceAssetRef {
	id: number
	role: CheckReferenceAssetRole
}

export type CheckBlockEvidence =
	| {
			type: 'columnUnit'
			columns: { heading?: string; body?: string }[]
	  }
	| { type: 'mediaShowcase' }
	| {
			type: 'colorPalette'
			title?: string
			colors: { name: string; hex: string; pantone?: string }[]
	  }
	| {
			type: 'doDont'
			title?: string
			groups: {
				category?: string
				description?: string
				kind: 'do' | 'ok' | 'dont'
				examples: { caption?: string }[]
			}[]
	  }

export type CheckEvidence =
	| CheckBlockEvidence
	| {
			type: 'document'
			description?: string
			blocks: CheckBlockEvidence[]
	  }

export interface CheckSourceSnapshot {
	evidence: CheckEvidence
	referenceAssets: CheckReferenceAssetRef[]
}

export interface BlockCheckSourceSnapshot {
	evidence: CheckBlockEvidence
	referenceAssets: CheckReferenceAssetRef[]
}

/**
 * 블록 타입별 동작 계약. 새 블록 타입은 이 계약을 구현하는 모듈을 만들고 registry에 등록한다.
 * formatForAgent는 필수 — 모든 블록은 agent 컨텍스트로 읽혀야 한다.
 */
export interface BlockBehavior {
	formatForAgent: (block: GuidelineBlock) => string
	toCheckSourceSnapshot: (block: GuidelineBlock) => BlockCheckSourceSnapshot
}
