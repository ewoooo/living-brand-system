import { contrastRatio } from './color-metrics'
import type { ColorPairObservation, DeterministicChecker } from './types'

export type { ContrastOptions } from '@/features/quality-rule/contrast-options'

/** 색상 쌍의 WCAG 대비율만 측정한다. 기준 적용과 판정은 evaluator가 소유한다. */
export const contrastChecker: DeterministicChecker<ColorPairObservation> = ({
	foreground,
	background,
}) => ({
	state: 'measured',
	measurements: { contrastRatio: contrastRatio(foreground, background) },
	facts: {
		foreground: rgbLabel(foreground),
		background: rgbLabel(background),
	},
})

function rgbLabel({ r, g, b }: ColorPairObservation['foreground']) {
	return `rgb(${r}, ${g}, ${b})`
}
