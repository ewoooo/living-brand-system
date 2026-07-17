import { type BlockCheckSourceSnapshot, projectBlock } from './catalog'
import type { GuidelineBlock } from './types'

/** 블록 하나를 agent 컨텍스트용 평문으로 변환한다. 빈 문자열은 호출측에서 걸러낸다. */
export function formatBlockForAgent(block: GuidelineBlock): string {
	return projectBlock(block).text
}

/** 블록 하나를 Check source evidence/referenceAssets로 정규화한다. */
export function snapshotBlock(block: GuidelineBlock): BlockCheckSourceSnapshot {
	const snapshot = projectBlock(block)
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
