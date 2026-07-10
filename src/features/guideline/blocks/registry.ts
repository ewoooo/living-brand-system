import type { GuidelinePage } from '@/payload-types'
import { behavior as colorPalette } from './color-palette.block'
import { behavior as columnUnit } from './column-unit.block'
import { behavior as doDont } from './do-dont.block'
import { behavior as mediaShowcase } from './media-showcase.block'
import type { BlockBehavior, GuidelineBlock, RuleDerivation } from './types'

// blockType → 동작. Record라서 새 블록 타입을 union에 추가하면 항목 누락이 컴파일 에러가 된다.
// 로직은 각 *.block.ts가 소유하고, 여기서는 배선만 한다.
const blockRegistry: Record<GuidelineBlock['blockType'], BlockBehavior> = {
	columnUnit,
	mediaShowcase,
	colorPalette,
	doDont,
}

/**
 * 페이지 블록들에서 룰 파생 목록을 만든다. 순수 함수 — rules 갱신 I/O는 GuidelinePages afterChange 훅이 소유한다.
 * 가이드라인(블록)이 SSOT이고 룰은 파생물이다.
 */
export function deriveRulesFromBlocks(blocks: GuidelinePage['blocks']): RuleDerivation[] {
	return (blocks ?? []).flatMap(
		(block) => blockRegistry[block.blockType].deriveRules?.(block) ?? [],
	)
}

/** 블록 룰을 역참조용 관계 인덱스로 중복 없이 변환한다. */
export function deriveRuleRefsFromBlocks(blocks: GuidelinePage['blocks']) {
	const relationId = (value: unknown) =>
		typeof value === 'number'
			? value
			: value && typeof value === 'object' && 'id' in value
				? (value.id as number)
				: null
	const ruleIds = (blocks ?? []).flatMap((block) =>
		block.blockType === 'doDont'
			? (block.groups ?? []).map(({ rule }) => relationId(rule))
			: [relationId(block.rule)],
	)

	return Array.from(new Set(ruleIds.filter((rule): rule is number => rule !== null)), (rule) => ({
		rule,
	}))
}

/** 블록 하나를 agent 컨텍스트용 평문으로 변환한다. 빈 문자열은 호출측에서 걸러낸다. */
export function formatBlockForAgent(block: GuidelineBlock): string {
	return blockRegistry[block.blockType].formatForAgent(block)
}
