import { describe, expect, it } from 'vitest'
import { FORWARD_STRAIGHT_DEFAULT_INPUT } from './graphic-runtimes/forward-straight/definition'
import {
	createForwardStraightScene,
	createForwardStraightVectorArtifact,
} from './graphic-runtimes/forward-straight/model'

describe('createForwardStraightScene', () => {
	it('기본값은 균일 두께의 평면 격자를 만든다', () => {
		const scene = createForwardStraightScene(FORWARD_STRAIGHT_DEFAULT_INPUT, {
			width: 400,
			height: 400,
		})

		expect(scene.origin).toEqual({ x: 200, y: 200 })
		expect(scene.dashes).toHaveLength(26 * 32)
		expect(new Set(scene.dashes.map((dash) => dash.weight.toFixed(6))).size).toBe(1)
		// 첫 dash는 좌상단 격자점에서 기준점(대각선 45°)을 향한다.
		expect(scene.dashes[0].x1).toBeCloseTo(15.04, 2)
		expect(scene.dashes[0].y1).toBeCloseTo(15.04, 2)
		expect(scene.dashes[0].x2).toBeCloseTo(7.18, 2)
		expect(scene.dashes[0].y2).toBeCloseTo(7.18, 2)
	})

	it('같은 입력은 캔버스 크기와 무관하게 닮은 구도를 만든다', () => {
		const small = createForwardStraightScene(FORWARD_STRAIGHT_DEFAULT_INPUT, {
			width: 400,
			height: 400,
		})
		const large = createForwardStraightScene(FORWARD_STRAIGHT_DEFAULT_INPUT, {
			width: 1200,
			height: 1200,
		})

		expect(large.dashes).toHaveLength(small.dashes.length)
		for (const [index, dash] of large.dashes.entries()) {
			const reference = small.dashes[index]
			expect(dash.x1).toBeCloseTo(reference.x1 * 3, 6)
			expect(dash.y1).toBeCloseTo(reference.y1 * 3, 6)
			expect(dash.weight).toBeCloseTo(reference.weight * 3, 6)
		}
	})

	it('원근 압축은 원경의 선을 짧고 얇게 만든다', () => {
		const viewport = { width: 400, height: 400 }
		const flat = createForwardStraightScene(FORWARD_STRAIGHT_DEFAULT_INPUT, viewport)
		const perspective = createForwardStraightScene(
			{
				...FORWARD_STRAIGHT_DEFAULT_INPUT,
				origin: { x: 1, y: 1 },
				perspectiveGamma: 4,
				depthScaleMin: 0.08,
			},
			viewport,
		)

		expect(dashLength(perspective.dashes[0])).toBeLessThan(dashLength(flat.dashes[0]))
		expect(perspective.dashes[0].weight).toBeLessThan(flat.dashes[0].weight)
		// 기준점에 가장 가까운 마지막 격자점은 축소되지 않는다.
		expect(
			dashLength(perspective.dashes.at(-1) as (typeof perspective.dashes)[number]),
		).toBeCloseTo(dashLength(flat.dashes[0]), 6)
	})

	it('두께 감쇠는 기준점에서 멀어질수록 얇아진다', () => {
		const scene = createForwardStraightScene(
			{ ...FORWARD_STRAIGHT_DEFAULT_INPUT, weightNear: 5, weightFar: 0.5 },
			{ width: 400, height: 400 },
		)
		const nearest = scene.dashes.reduce((best, dash) =>
			distanceToOrigin(dash, scene.origin) < distanceToOrigin(best, scene.origin)
				? dash
				: best,
		)

		expect(nearest.weight).toBeGreaterThan(scene.dashes[0].weight)
	})
})

describe('createForwardStraightVectorArtifact', () => {
	it('shared geometry를 파일 형식과 무관한 Vector Artifact로 투영한다', () => {
		const scene = createForwardStraightScene(FORWARD_STRAIGHT_DEFAULT_INPUT, {
			width: 400,
			height: 400,
		})
		const artifact = createForwardStraightVectorArtifact(scene)

		expect(artifact).toMatchObject({
			kind: 'vector',
			source: { width: 400, height: 400, background: '#030402' },
		})
		// 기준점 마커는 산출물에 남지 않는다 — primitive는 dash 뿐이다.
		expect(artifact.source.primitives).toHaveLength(scene.dashes.length)
		expect(artifact.source.primitives.every((primitive) => primitive.kind === 'line')).toBe(
			true,
		)
		expect(artifact.source.primitives[0]).toMatchObject({
			kind: 'line',
			stroke: '#ffffff',
			lineCap: 'square',
		})
	})
})

function dashLength(dash: { x1: number; y1: number; x2: number; y2: number }) {
	return Math.hypot(dash.x1 - dash.x2, dash.y1 - dash.y2)
}

function distanceToOrigin(
	dash: { x1: number; y1: number; x2: number; y2: number },
	origin: { x: number; y: number },
) {
	return Math.hypot((dash.x1 + dash.x2) / 2 - origin.x, (dash.y1 + dash.y2) / 2 - origin.y)
}
