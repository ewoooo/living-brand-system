import { describe, expect, it } from 'vitest'
import { FORWARD_STRAIGHT_DEFAULT_INPUT } from './graphic-runtimes/forward-straight/definition'
import {
	createForwardStraightScene,
	createForwardStraightVectorArtifact,
} from './graphic-runtimes/forward-straight/model'

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

describe('createForwardStraightVectorArtifact', () => {
	it('shared geometry를 파일 형식과 무관한 Vector Artifact로 투영한다', () => {
		const scene = createForwardStraightScene(FORWARD_STRAIGHT_DEFAULT_INPUT, {
			width: 100,
			height: 100,
		})
		const artifact = createForwardStraightVectorArtifact(scene)

		expect(artifact).toMatchObject({
			kind: 'vector',
			source: { width: 100, height: 100, background: '#030402' },
		})
		expect(artifact.source.primitives).toHaveLength(5)
		expect(artifact.source.primitives[0]).toMatchObject({
			kind: 'line',
			stroke: '#ffffff',
			strokeWidth: 1,
			lineCap: 'square',
		})
		const line = artifact.source.primitives[0]
		if (line?.kind !== 'line') throw new Error('첫 Vector primitive가 line이 아닙니다.')
		expect(line.x1).toBeCloseTo(40.61, 2)
		expect(line.y1).toBeCloseTo(40.61, 2)
		expect(line.x2).toBeCloseTo(19.39, 2)
		expect(line.y2).toBeCloseTo(19.39, 2)
		expect(artifact.source.primitives[4]).toEqual({
			kind: 'circle',
			cx: 50,
			cy: 50,
			radius: 2.5,
			fill: '#ff2a2a',
		})
	})
})
