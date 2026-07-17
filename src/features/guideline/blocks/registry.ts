import type { BlockCheckSourceSnapshot } from '../checks/check-source'
import { behavior as colorPalette } from './color-palette.block'
import { behavior as columnUnit } from './column-unit.block'
import { behavior as doDont } from './do-dont.block'
import { behavior as mediaShowcase } from './media-showcase.block'
import type { BlockBehavior, GuidelineBlock } from './types'

// blockType → 동작. Record라서 새 블록 타입을 union에 추가하면 항목 누락이 컴파일 에러가 된다.
// 로직은 각 *.block.ts가 소유하고, 여기서는 배선만 한다.
const blockRegistry: Record<GuidelineBlock['blockType'], BlockBehavior> = {
	columnUnit,
	mediaShowcase,
	colorPalette,
	doDont,
}

/** 블록 하나를 agent 컨텍스트용 평문으로 변환한다. 빈 문자열은 호출측에서 걸러낸다. */
export function formatBlockForAgent(block: GuidelineBlock): string {
	return blockRegistry[block.blockType].formatForAgent(block)
}

/** 블록 하나를 Check source evidence/referenceAssets로 정규화한다. */
export function snapshotBlock(block: GuidelineBlock): BlockCheckSourceSnapshot {
	const snapshot = blockRegistry[block.blockType].toCheckSourceSnapshot(block)
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
