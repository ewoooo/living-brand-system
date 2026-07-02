import { colorPaletteChecker } from './color-palette.checker'
import { imageryBackgroundToneChecker } from './imagery-background-tone.checker'
import type { RuleChecker } from './types'

/**
 * rule key → checker 레지스트리.
 * checker는 1룰=1파일로 항목화돼 있고, 여기 한 줄 등록/교체로 붙였다 뗐다 한다.
 * 아직 checker가 없는 룰은 미개발로 빠지고, 추가하며 점진 확장한다.
 * essenherb color 검수는 palette(허용 색) + pairing(허용 조합) 2축으로 수렴 —
 * scale/roles/contrast/combo는 팔레트 정의·서사이거나 pairing에 흡수돼 제거했다.
 */
const checkers: Record<string, RuleChecker> = {
	[colorPaletteChecker.ruleKey]: colorPaletteChecker,
	[imageryBackgroundToneChecker.ruleKey]: imageryBackgroundToneChecker,
}

export function getChecker(ruleKey: string): RuleChecker | null {
	return checkers[ruleKey] ?? null
}
