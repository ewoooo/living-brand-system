import { describe, expect, it } from 'vitest'
import { forwardStraightInputSchema, forwardStraightToolContract } from './forward-straight'

describe('forwardStraightToolContract', () => {
	it('accepts its defaults and rejects invalid or unknown input', () => {
		expect(
			forwardStraightInputSchema.safeParse(forwardStraightToolContract.defaultInput).success,
		).toBe(true)
		expect(
			forwardStraightInputSchema.safeParse({
				...forwardStraightToolContract.defaultInput,
				origin: { x: 1.1, y: 0.5 },
			}).success,
		).toBe(false)
		expect(
			forwardStraightInputSchema.safeParse({
				...forwardStraightToolContract.defaultInput,
				extra: true,
			}).success,
		).toBe(false)
	})
})
