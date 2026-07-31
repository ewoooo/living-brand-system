import { z } from 'zod'

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
