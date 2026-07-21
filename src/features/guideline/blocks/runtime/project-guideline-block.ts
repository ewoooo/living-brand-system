import {
	type CheckBlockEvidence,
	guidelineBlockProjectors,
} from '../../catalog/projection.generated'
import type { BlockProjection, CheckReferenceAssetRef, GuidelineBlock } from '../types'

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

/** 등록된 블록을 Agent/Search와 Check가 공유하는 표현으로 변환한다. */
export function projectGuidelineBlock(block: GuidelineBlock): BlockProjection<CheckBlockEvidence> {
	const projector = guidelineBlockProjectors[block.blockType]
	return projector(block as never)
}

/** 블록 하나를 agent 컨텍스트용 평문으로 변환한다. 빈 문자열은 호출측에서 걸러낸다. */
export function formatBlockForAgent(block: GuidelineBlock): string {
	return projectGuidelineBlock(block).text
}

/** 블록 하나를 Check source evidence/referenceAssets로 정규화한다. */
export function snapshotBlock(block: GuidelineBlock): BlockCheckSourceSnapshot {
	const snapshot = projectGuidelineBlock(block)
	const uniqueReferenceAssets = Array.from(
		new Map(
			snapshot.referenceAssets.map((asset) => [`${asset.id}:${asset.role}`, asset]),
		).values(),
	)

	return {
		evidence: snapshot.evidence,
		referenceAssets: uniqueReferenceAssets,
	}
}
