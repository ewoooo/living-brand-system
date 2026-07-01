import { colorComboTonalBalanceChecker } from './color-combo-tonal-balance.checker'
import { colorContrastChecker } from './color-contrast.checker'
import { colorPaletteChecker } from './color-palette.checker'
import { colorScaleChecker } from './color-scale.checker'
import { imageryBackgroundToneChecker } from './imagery-background-tone.checker'
import type { RuleChecker } from './types'

/**
 * rule key → checker 레지스트리.
 * checker는 1룰=1파일로 항목화돼 있고, 여기 한 줄 등록/교체로 붙였다 뗐다 한다.
 * 아직 checker가 없는 룰은 미개발로 빠지고, 추가하며 점진 확장한다.
 */
const checkers: Record<string, RuleChecker> = {
	[colorPaletteChecker.ruleKey]: colorPaletteChecker,
	[colorScaleChecker.ruleKey]: colorScaleChecker,
	[colorContrastChecker.ruleKey]: colorContrastChecker,
	[colorComboTonalBalanceChecker.ruleKey]: colorComboTonalBalanceChecker,
	[imageryBackgroundToneChecker.ruleKey]: imageryBackgroundToneChecker,
}

export function getChecker(ruleKey: string): RuleChecker | null {
	return checkers[ruleKey] ?? null
}

export function getAllCheckers(): RuleChecker[] {
	return Object.values(checkers)
}
