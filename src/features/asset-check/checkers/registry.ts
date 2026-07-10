/**
 * Checker registry — RuleSpec checkerKey와 checker 구현, 룰별 기준 데이터를 연결한다.
 * checker 파일은 알고리즘 하나만 소유하고, 같은 알고리즘을 쓰는 룰은
 * 여기서 데이터만 다르게 바인딩한다 (룰별 래퍼 파일 금지).
 */
import { backgroundToneChecker } from './background-tone.checker'
import { type CanvasFormat, makeCanvasFormatChecker } from './canvas-format.checker'
import { clearSpaceChecker } from './clear-space.checker'
import { colorCombinationChecker } from './color-combination.checker'
import { paletteComplianceChecker } from './palette-compliance.checker'
import { relativeSizeChecker } from './relative-size.checker'
import { spotColorChecker } from './spot-color.checker'
import type { AlgorithmChecker } from './types'

const STATIONERY_FORMATS: CanvasFormat[] = [
	{ label: '명함 90×50mm', width: 90, height: 50 },
	{ label: '리플렛 A4 210×297mm', width: 210, height: 297 },
	{ label: '제품 정보 카드 A5 148×210mm', width: 148, height: 210 },
]

const ADVERTISEMENT_FORMATS: CanvasFormat[] = [
	{ label: '16:9', width: 16, height: 9 },
	{ label: '3:4', width: 3, height: 4 },
	{ label: '3:1', width: 3, height: 1 },
	{ label: '1:1', width: 1, height: 1 },
	{ label: '1:2', width: 1, height: 2 },
	{ label: 'Offline 1440×2100mm', width: 1440, height: 2100 },
	{ label: 'Offline 2400×1600mm', width: 2400, height: 1600 },
	{ label: 'Offline 8600×2100mm', width: 8600, height: 2100 },
]

const ADVERTISEMENT_TEMPLATE_FORMATS: CanvasFormat[] = [
	{ label: 'Offline Vertical 1440×2100mm', width: 1440, height: 2100 },
	{ label: 'Offline Horizontal 2400×1600mm', width: 2400, height: 1600 },
	{ label: 'Offline Horizontal(long) 8600×2100mm', width: 8600, height: 2100 },
]

const SNS_FORMATS: CanvasFormat[] = [
	{ label: 'Feed 1080×1440px', width: 1080, height: 1440 },
	{ label: 'Reels 1080×1920px', width: 1080, height: 1920 },
]

const SNS_CANVAS_FORMATS: CanvasFormat[] = [
	{ label: '3:5(SNS) 1080×1440px', width: 1080, height: 1440 },
]

const VISUAL_TEMPLATE_FORMATS: CanvasFormat[] = [
	{ label: '1:1 1080×1080px', width: 1, height: 1 },
	{ label: '3:5(SNS) 1080×1440px', width: 1080, height: 1440 },
	{ label: 'A4 210×297mm', width: 210, height: 297 },
	{ label: '3:1 1920×640px', width: 3, height: 1 },
	{ label: '16:9 1920×1080px', width: 16, height: 9 },
]

const WEB_FORMATS: CanvasFormat[] = [
	{ label: '16:9 1920×1080px', width: 16, height: 9 },
	{ label: '3:1 1920×640px', width: 3, height: 1 },
]

/**
 * checker key → checker 레지스트리.
 * essenherb color 검수는 palette(허용 색) + pairing(허용 조합) 2축으로 수렴 —
 * scale/roles/contrast/combo는 팔레트 정의·서사이거나 pairing에 흡수돼 제거했다.
 * color.mode는 파일 색모드 메타가 래스터에 없어 spot-color와 같은 픽셀 프록시로 판정한다.
 */
const checkers: Record<string, AlgorithmChecker> = {
	'palette-compliance': paletteComplianceChecker,
	'color-combination': colorCombinationChecker,
	'spot-color': spotColorChecker,
	'background-tone': backgroundToneChecker,
	'clear-space': clearSpaceChecker,
	'relative-size': relativeSizeChecker,
}

// canvas-format의 기준값은 RuleValue 도입 전까지 기존 룰 키별 설정을 재사용한다.
const canvasFormatCheckers: Record<string, AlgorithmChecker> = {
	// 스테이셔너리는 mm 규격·회전 자유라 방향 무시 + 느슨한 허용 오차로 본다.
	'application.stationery.format': makeCanvasFormatChecker(STATIONERY_FORMATS, {
		tolerance: 0.05,
		ignoreOrientation: true,
	}),
	'application.sns.format': makeCanvasFormatChecker(SNS_FORMATS),
	'application.sns.canvas.format': makeCanvasFormatChecker(SNS_CANVAS_FORMATS),
	'application.web': makeCanvasFormatChecker(WEB_FORMATS),
	'application.advertisement.format': makeCanvasFormatChecker(ADVERTISEMENT_FORMATS),
	'layout.visual.template': makeCanvasFormatChecker(VISUAL_TEMPLATE_FORMATS),
	'layout.sns.template': makeCanvasFormatChecker(SNS_FORMATS),
	'layout.advertisement.template': makeCanvasFormatChecker(ADVERTISEMENT_TEMPLATE_FORMATS),
}

export function getChecker(checkerKey: string, ruleKey: string): AlgorithmChecker | null {
	return checkerKey === 'canvas-format'
		? (canvasFormatCheckers[ruleKey] ?? null)
		: (checkers[checkerKey] ?? null)
}

export function hasChecker(checkerKey: string, ruleKey: string): boolean {
	return getChecker(checkerKey, ruleKey) !== null
}
