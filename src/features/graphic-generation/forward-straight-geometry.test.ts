import { describe, expect, it } from 'vitest'
import { FORWARD_STRAIGHT_DEFAULT_INPUT } from './forward-straight'
import { createForwardStraightScene, createForwardStraightSvg } from './forward-straight-geometry'

describe('createForwardStraightScene', () => {
	it('builds a flat grid and applies perspective depth without p5', () => {
		const flat = createForwardStraightScene(FORWARD_STRAIGHT_DEFAULT_INPUT, {
			width: 100,
			height: 100,
		})
		expect(
			createForwardStraightScene(FORWARD_STRAIGHT_DEFAULT_INPUT, {
				width: 100,
				height: 100,
			}),
		).toEqual(flat)

		expect(flat.origin).toEqual({ x: 50, y: 50 })
		expect(flat.dashes).toHaveLength(4)
		expect(flat.dashes[0]).toMatchObject({ weight: 1 })
		expect(flat.dashes[0].x1).toBeCloseTo(40.61, 2)
		expect(flat.dashes[0].y1).toBeCloseTo(40.61, 2)

		const perspective = createForwardStraightScene(
			{
				...FORWARD_STRAIGHT_DEFAULT_INPUT,
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

describe('createForwardStraightSvg', () => {
	it('serializes the shared geometry as SVG', () => {
		const scene = createForwardStraightScene(FORWARD_STRAIGHT_DEFAULT_INPUT, {
			width: 100,
			height: 100,
		})
		const svg = createForwardStraightSvg(scene)
		expect(createForwardStraightSvg(scene)).toBe(svg)

		expect(svg).toContain('width="100" height="100" viewBox="0 0 100 100"')
		expect(svg).toContain('<rect width="100" height="100" fill="#030402" />')
		expect(svg.match(/<line /g)).toHaveLength(4)
		expect(svg).toContain(
			'<line x1="40.61" y1="40.61" x2="19.39" y2="19.39" stroke="#ffffff" stroke-width="1.00" stroke-linecap="square" />',
		)
		expect(svg).toContain('<circle cx="50.00" cy="50.00" r="2.50" fill="#ff2a2a" />')
	})
})
