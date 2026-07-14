import { z } from 'zod'
import { contrastRatio } from './color-metrics'
import type { ColorPairObservation, DeterministicChecker } from './types'

const contrastCriterionSchema = z.strictObject({
	measurement: z.literal('contrastRatio'),
	operator: z.literal('gte'),
	expected: z.number().min(1).max(21),
})

export const contrastOptionsSchema = z.strictObject({
	parameters: z.strictObject({}).optional(),
	criteria: z.tuple([contrastCriterionSchema]),
})

export type ContrastOptions = z.infer<typeof contrastOptionsSchema>

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
