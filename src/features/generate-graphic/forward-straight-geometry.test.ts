import { describe, expect, it } from 'vitest'
import { forwardStraightToolContract } from './forward-straight'
import { createForwardStraightScene } from './forward-straight-geometry'

describe('createForwardStraightScene', () => {
	it('builds a flat grid and applies perspective depth without p5', () => {
		const flat = createForwardStraightScene(forwardStraightToolContract.defaultInput, {
			width: 100,
			height: 100,
		})

		expect(flat.origin).toEqual({ x: 50, y: 50 })
		expect(flat.dashes).toHaveLength(4)
		expect(flat.dashes[0]).toMatchObject({ weight: 1 })
		expect(flat.dashes[0].x1).toBeCloseTo(40.61, 2)
		expect(flat.dashes[0].y1).toBeCloseTo(40.61, 2)

		const perspective = createForwardStraightScene(
			{
				...forwardStraightToolContract.defaultInput,
				variableWeightEnabled: true,
				viewpoint: 'low-angle',
				origin: { x: 1, y: 1 },
			},
			{ width: 100, height: 100 },
		)
		const flatLength = Math.hypot(
			flat.dashes[0].x1 - flat.dashes[0].x2,
			flat.dashes[0].y1 - flat.dashes[0].y2,
		)
		const perspectiveLength = Math.hypot(
			perspective.dashes[0].x1 - perspective.dashes[0].x2,
			perspective.dashes[0].y1 - perspective.dashes[0].y2,
		)

		expect(perspectiveLength).toBeLessThan(flatLength)
		expect(perspective.dashes[0].weight).not.toBe(1)
	})
})
