/**
 * Checker registry — ruleKey와 기능별 checker 구현을 연결한다.
 * 파일 경로는 검사 기능 기준이고, ruleKey는 Payload 룰 카탈로그의 도메인 이름을 유지한다.
 */
import { colorCombinationChecker } from './color/color-combination.checker'
import { colorModeChecker } from './color/color-mode.checker'
import { paletteComplianceChecker } from './color/palette-compliance.checker'
import { spotColorChecker } from './color/spot-color.checker'
import { advertisementFormatChecker } from './geometry/advertisement-format.checker'
import { advertisementTemplateFormatChecker } from './geometry/advertisement-template-format.checker'
import { aspectRatioChecker } from './geometry/aspect-ratio.checker'
import { clearSpaceChecker } from './geometry/clear-space.checker'
import { relativeSizeChecker } from './geometry/relative-size.checker'
import { snsCanvasFormatChecker } from './geometry/sns-canvas-format.checker'
import { snsFormatChecker } from './geometry/sns-format.checker'
import { snsTemplateFormatChecker } from './geometry/sns-template-format.checker'
import { visualTemplateFormatChecker } from './geometry/visual-template-format.checker'
import { webFormatChecker } from './geometry/web-format.checker'
import { backgroundToneChecker } from './imagery/background-tone.checker'
import type { AlgorithmChecker } from './types'

/**
 * rule key → checker 레지스트리.
 * checker는 1룰=1파일로 항목화돼 있고, 여기 한 줄 등록/교체로 붙였다 뗐다 한다.
 * 아직 checker가 없는 룰은 미개발로 빠지고, 추가하며 점진 확장한다.
 * essenherb color 검수는 palette(허용 색) + pairing(허용 조합) 2축으로 수렴 —
 * scale/roles/contrast/combo는 팔레트 정의·서사이거나 pairing에 흡수돼 제거했다.
 */
const checkers: Record<string, AlgorithmChecker> = {
	'color.palette': paletteComplianceChecker,
	'color.combination': colorCombinationChecker,
	'imagery.background.tone': backgroundToneChecker,
	'logo.space.clear': clearSpaceChecker,
	'logo.size.minimum': relativeSizeChecker,
	'application.stationery.format': aspectRatioChecker,
	'application.print.spec': spotColorChecker,
	'application.sns.format': snsFormatChecker,
	'application.web': webFormatChecker,
	'application.advertisement.format': advertisementFormatChecker,
	'layout.visual.template': visualTemplateFormatChecker,
	'application.sns.canvas.format': snsCanvasFormatChecker,
	'layout.sns.template': snsTemplateFormatChecker,
	'layout.advertisement.template': advertisementTemplateFormatChecker,
	'color.mode': colorModeChecker,
}

export function getChecker(ruleKey: string): AlgorithmChecker | null {
	return checkers[ruleKey] ?? null
}

export function hasChecker(ruleKey: string): boolean {
	return ruleKey in checkers
}
