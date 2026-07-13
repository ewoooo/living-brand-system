/** Checker registry — RuleChecker checkerKey와 실행 구현을 연결한다. */
import { backgroundToneChecker } from './background-tone.checker'
import {
	type CanvasFormat,
	type CanvasFormatOptions,
	makeCanvasFormatChecker,
} from './canvas-format.checker'
import { clearSpaceChecker } from './clear-space.checker'
import { colorCombinationChecker } from './color-combination.checker'
import { paletteComplianceChecker } from './palette-compliance.checker'
import { relativeSizeChecker } from './relative-size.checker'
import { spotColorChecker } from './spot-color.checker'
import type { AlgorithmChecker } from './types'

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

interface CanvasFormatCheckOptions extends CanvasFormatOptions {
	formats: CanvasFormat[]
}

export function getChecker(checkerKey: string, options?: unknown): AlgorithmChecker | null {
	if (checkerKey !== 'canvas-format') return checkers[checkerKey] ?? null
	if (!isCanvasFormatOptions(options)) return null
	return makeCanvasFormatChecker(options.formats, options)
}

export function hasChecker(checkerKey: string, options?: unknown): boolean {
	return getChecker(checkerKey, options) !== null
}

function isCanvasFormatOptions(value: unknown): value is CanvasFormatCheckOptions {
	if (!value || typeof value !== 'object') return false
	const options = value as Partial<CanvasFormatCheckOptions>
	return (
		Array.isArray(options.formats) &&
		options.formats.length > 0 &&
		options.formats.every(
			(format) =>
				typeof format.label === 'string' &&
				format.label.length > 0 &&
				Number.isFinite(format.width) &&
				format.width > 0 &&
				Number.isFinite(format.height) &&
				format.height > 0,
		) &&
		(options.tolerance === undefined ||
			(Number.isFinite(options.tolerance) && options.tolerance >= 0)) &&
		(options.ignoreOrientation === undefined || typeof options.ignoreOrientation === 'boolean')
	)
}
