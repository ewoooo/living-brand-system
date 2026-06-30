import { colorPaletteChecker } from './color-palette.checker'
import type { RuleChecker } from './types'

/**
 * rule key → checker 레지스트리.
 * 아직 checker가 없는 룰은 unsupported로 빠지고, checker를 추가하며 점진 확장한다.
 */
const checkers: Record<string, RuleChecker> = {
	[colorPaletteChecker.ruleKey]: colorPaletteChecker,
}

export function getChecker(ruleKey: string): RuleChecker | null {
	return checkers[ruleKey] ?? null
}

export function getAllCheckers(): RuleChecker[] {
	return Object.values(checkers)
}
