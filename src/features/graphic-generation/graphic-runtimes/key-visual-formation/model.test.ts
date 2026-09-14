import { describe, expect, it } from 'vitest'
import { KEY_VISUAL_FORMATION_DEFAULT_INPUT } from './definition'
import {
	createKeyVisualFormationScene,
	createKeyVisualFormationVectorArtifact,
	type KeyVisualFormationInput,
	keyVisualFormationLineChoices,
	default as model,
	toKeyVisualFormationInput,
} from './model'

const viewport = { width: 1080, height: 1080 }

function scene(overrides: Partial<KeyVisualFormationInput> = {}) {
	return createKeyVisualFormationScene(
		{ ...KEY_VISUAL_FORMATION_DEFAULT_INPUT, ...overrides },
		viewport,
	)
}

describe('createKeyVisualFormationScene', () => {
	it('면은 판 자체다 — 밴드는 선 개수만큼만 나온다', () => {
		expect(scene({ steps: 6 }).bands).toHaveLength(6)
		expect(scene({ steps: 20 }).bands).toHaveLength(20)
	})

	it('선의 영역은 면 비율이 남긴 만큼이고 unit은 모두 같다', () => {
		const steps = 8
		const planeRatio = 0.6
		const unit = (viewport.height * (1 - planeRatio)) / steps
		const { bands } = scene({ steps, planeRatio, anchor: 'bottom' })
		// unit 격자에 얹혀 있는지는 자리에서 잰 시작 거리가 말한다.
		const starts = bands.map((band) => viewport.height - band.y - band.height)
		for (const [index, start] of starts.entries()) {
			expect(start).toBeCloseTo(index * unit, 6)
		}
	})

	it('선의 자리에 붙은 것이 가장 굵고 멀어질수록 가늘어진다', () => {
		const heights = scene().bands.map((band) => band.height)
		expect(heights).toEqual([...heights].sort((left, right) => right - left))
	})

	it('가장 먼 선도 감쇠를 따라 움직인다 — 어떤 선도 하한에 눌려 멈추지 않는다', () => {
		const farthest = (decay: number) => scene({ decay }).bands.at(-1)?.height ?? 0
		expect(farthest(0.5)).toBeGreaterThan(farthest(3))
	})

	it('선도 그 사이에 남는 면도 최소 두께 아래로 내려가지 않는다', () => {
		for (const decay of [0.1, 1, 4]) {
			const steps = 20
			const unit = (viewport.height * (1 - 0.5)) / steps
			const floor = Math.min(unit / 2, 2)
			for (const band of scene({ decay, steps }).bands) {
				expect(band.height).toBeGreaterThanOrEqual(floor - 1e-9)
				expect(unit - band.height).toBeGreaterThanOrEqual(floor - 1e-9)
			}
		}
	})

	it('선의 자리가 축과 방향을 정한다', () => {
		const bottom = scene({ anchor: 'bottom' }).bands[0]
		const right = scene({ anchor: 'right' }).bands[0]
		if (!bottom || !right) throw new Error('선이 없다')

		// 자리에 붙은 첫 선은 그 변에 닿는다.
		expect(bottom.y + bottom.height).toBeCloseTo(viewport.height, 6)
		expect(bottom.width).toBe(viewport.width)
		expect(right.x + right.width).toBeCloseTo(viewport.width, 6)
		expect(right.height).toBe(viewport.height)
	})
})

describe('선 색은 면보다 밝다', () => {
	it('면 단계보다 낮은 색만 고를 수 있다', () => {
		expect(keyVisualFormationLineChoices('deep')).toEqual(['white', 'heritage', 'prosperity'])
		expect(keyVisualFormationLineChoices('heritage')).toEqual(['white'])
		expect(keyVisualFormationLineChoices('white')).toEqual([])
	})

	it('면을 밝게 바꾸면 규칙 밖으로 나간 선 색을 끌어내린다', () => {
		const input = toKeyVisualFormationInput({
			...KEY_VISUAL_FORMATION_DEFAULT_INPUT,
			planeColor: 'heritage',
			lineColor: 'prosperity',
		})
		expect(input.lineColor).toBe('white')
	})
})

describe('createKeyVisualFormationVectorArtifact', () => {
	it('이미지와 디머가 선보다 아래에 깔린다', () => {
		const artifact = createKeyVisualFormationVectorArtifact(
			scene({ planeImage: 'https://example.test/a.png', dimmer: true, dimmerOpacity: 0.4 }),
		)
		const kinds = artifact.source.primitives.map((primitive) => primitive.kind)
		expect(kinds[0]).toBe('image')
		expect(artifact.source.primitives[1]).toMatchObject({ fill: '#000000', opacity: 0.4 })
		expect(kinds).toHaveLength(2 + KEY_VISUAL_FORMATION_DEFAULT_INPUT.steps)
	})

	it('디머가 꺼져 있으면 덮개를 만들지 않는다', () => {
		const artifact = createKeyVisualFormationVectorArtifact(scene({ dimmer: false }))
		expect(artifact.source.primitives).toHaveLength(KEY_VISUAL_FORMATION_DEFAULT_INPUT.steps)
	})
})

describe('getRestrictions', () => {
	it('선택지를 좁히면 기본값도 그 안으로 함께 좁아진다', () => {
		// 🔴 좁힌 선택지에 없는 기본값은 계약이 거부한다 — 좁히기만 하면 스튜디오가 뜨지 않는다.
		const restriction = model
			.getRestrictions({ ...KEY_VISUAL_FORMATION_DEFAULT_INPUT, planeColor: 'heritage' })
			.controls.find((control) => control.controlId === 'lineColor')
		expect(restriction?.optionValues).toEqual(['white'])
		expect(restriction?.defaultValue).toBe('white')
	})
})
