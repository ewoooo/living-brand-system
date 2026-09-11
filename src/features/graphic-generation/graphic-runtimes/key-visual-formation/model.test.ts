import { describe, expect, it } from 'vitest'
import { KEY_VISUAL_FORMATION_DEFAULT_INPUT } from './definition'
import { createKeyVisualFormationScene, type KeyVisualFormationInput } from './model'

const viewport = { width: 1080, height: 1080 }

function scene(overrides: Partial<KeyVisualFormationInput> = {}) {
	return createKeyVisualFormationScene(
		{ ...KEY_VISUAL_FORMATION_DEFAULT_INPUT, ...overrides },
		viewport,
	)
}

describe('createKeyVisualFormationScene', () => {
	it('면 하나에 단계 수만큼의 선이 붙는다', () => {
		expect(scene({ steps: 6 }).bands).toHaveLength(7)
		expect(scene({ steps: 20 }).bands).toHaveLength(21)
	})

	it('면에서 멀어질수록 선이 굵어진다', () => {
		const [, ...lines] = scene().bands
		const heights = lines.map((band) => band.height)
		expect(heights).toEqual([...heights].sort((left, right) => left - right))
	})

	it('선도 그 사이에 남는 면도 최소 두께 아래로 내려가지 않는다', () => {
		for (const decay of [-4, 0, 4]) {
			const [plane, ...lines] = scene({ decay, steps: 20 }).bands
			if (!plane) throw new Error('면이 없다')
			const slot = (viewport.height - plane.height) / 20
			for (const line of lines) {
				expect(line.height).toBeGreaterThanOrEqual(Math.min(slot / 2, 2) - 1e-9)
				expect(slot - line.height).toBeGreaterThanOrEqual(Math.min(slot / 2, 2) - 1e-9)
			}
		}
	})

	it('면의 영역이 선의 영역보다 좁지 않다 — 가이드라인의 1:1 하한', () => {
		const [plane, ...lines] = scene({ planeRatio: 0.5 }).bands
		if (!plane) throw new Error('면이 없다')
		const lineArea = viewport.height - plane.height
		expect(plane.height).toBeGreaterThanOrEqual(lineArea)
		expect(lines.length).toBeGreaterThanOrEqual(6)
	})

	it('면의 자리를 바꾸면 축과 방향이 바뀐다', () => {
		const bottom = scene({ anchor: 'bottom' }).bands[0]
		const left = scene({ anchor: 'left' }).bands[0]
		if (!bottom || !left) throw new Error('면이 없다')

		expect(bottom.y).toBeCloseTo(viewport.height / 2, 5)
		expect(left).toMatchObject({ x: 0, width: viewport.width / 2 })
	})
})
