import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
	LINEAR_FLUTED_GLASS_DEFAULT_INPUT,
	linearFlutedGlassInputSchema,
} from '@/features/graphic-generation/graphic-runtimes/linear-fluted-glass/model'
import { resolveRangeStep, schemaToControls } from './schema-to-controls'

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i)

describe('schemaToControls', () => {
	it('숫자 범위를 슬라이더로 옮기고 min·max를 그대로 가져온다', () => {
		const { controls } = schemaToControls(
			z.strictObject({ rayBloom: z.number().min(0).max(1) }),
			{ rayBloom: 0.4 },
		)

		expect(controls).toEqual([
			{
				id: 'rayBloom',
				label: 'ray bloom',
				kind: 'range',
				defaultValue: 0.4,
				min: 0,
				max: 1,
				step: 0.01,
			},
		])
	})

	it('hex 패턴 문자열은 색 컨트롤이 된다 — 자유 문자열로 떨어지면 안 된다', () => {
		const { controls } = schemaToControls(z.strictObject({ rayColor1: hexColor }), {
			rayColor1: '#00af41',
		})

		expect(controls[0]).toMatchObject({ kind: 'color', defaultValue: '#00af41' })
	})

	it('enum은 select가 되고 선택지를 그대로 싣는다', () => {
		const { controls } = schemaToControls(
			z.strictObject({ distortionShape: z.enum(['cascade', 'flat']) }),
			{ distortionShape: 'flat' },
		)

		expect(controls[0]).toMatchObject({
			kind: 'select',
			defaultValue: 'flat',
			options: [
				{ value: 'cascade', label: 'cascade' },
				{ value: 'flat', label: 'flat' },
			],
		})
	})

	it('{x, y} 객체는 pad가 된다', () => {
		const { controls } = schemaToControls(
			z.strictObject({
				source: z.strictObject({
					x: z.number().min(-1).max(1),
					y: z.number().min(-1).max(1),
				}),
			}),
			{ source: { x: -0.62, y: 0.1 } },
		)

		expect(controls[0]).toMatchObject({ kind: 'pad', defaultValue: { x: -0.62, y: 0.1 } })
	})

	it('🔴 옮기지 못한 필드는 조용히 버리지 않고 skipped로 돌려준다', () => {
		// 상한이 없는 숫자는 슬라이더를 못 만든다 — text로 떨어뜨리면 셰이더에 아무 값이나 들어간다.
		const { controls, skipped } = schemaToControls(
			z.strictObject({ note: z.string(), unbounded: z.number() }),
			{},
		)

		expect(controls).toEqual([])
		expect(skipped).toEqual(['note', 'unbounded'])
	})

	it('라벨을 주면 그것을 쓰고, 없으면 식별자를 편다', () => {
		const { controls } = schemaToControls(
			z.strictObject({ glassEdgeSoftness: z.number().min(0).max(1) }),
			{ glassEdgeSoftness: 0.5 },
		)
		expect(controls[0]?.label).toBe('glass edge softness')

		const labeled = schemaToControls(
			z.strictObject({ glassEdgeSoftness: z.number().min(0).max(1) }),
			{ glassEdgeSoftness: 0.5 },
			{ glassEdgeSoftness: '유리 가장자리' },
		)
		expect(labeled.controls[0]?.label).toBe('유리 가장자리')
	})
})

describe('resolveRangeStep', () => {
	// 🔴 0~1 축에 step 1을 주면 고를 수 있는 값이 0과 1 둘뿐이 된다.
	it('좁은 범위일수록 잘게 썬다', () => {
		expect(resolveRangeStep(0, 1)).toBe(0.01)
		expect(resolveRangeStep(-1, 1)).toBe(0.01)
		expect(resolveRangeStep(0.1, 2)).toBe(0.01)
		expect(resolveRangeStep(0, 4)).toBe(0.1)
		expect(resolveRangeStep(-180, 180)).toBe(1)
	})
})

describe('실물 셰이더 스키마', () => {
	// 🔑 이 변환기의 존재 이유가 「45개를 손으로 안 적는 것」이므로, 실물에서 몇 개가 나오는지가 계약이다.
	const { controls, skipped } = schemaToControls(
		linearFlutedGlassInputSchema,
		LINEAR_FLUTED_GLASS_DEFAULT_INPUT,
	)

	it('Linear Fluted Glass의 파라미터를 하나도 빠뜨리지 않는다', () => {
		const declared = Object.keys(LINEAR_FLUTED_GLASS_DEFAULT_INPUT)

		expect(skipped).toEqual([])
		expect(controls).toHaveLength(declared.length)
		expect(controls.map((control) => control.id).sort()).toEqual([...declared].sort())
	})

	it('스튜디오가 노출하는 소수보다 훨씬 많다 — 그것이 프리셋이 필요한 이유다', () => {
		expect(controls.length).toBeGreaterThan(30)
	})

	it('종류가 골고루 나온다', () => {
		const kinds = new Set(controls.map((control) => control.kind))

		expect(kinds).toContain('range')
		expect(kinds).toContain('color')
		expect(kinds).toContain('select')
		expect(kinds).toContain('pad')
	})
})
