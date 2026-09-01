import { describe, expect, it } from 'vitest'
import type { ControllerGroupDefinition } from '@/modules/studio-controller/controller-definition'
import {
	findGraphicProfilePreset,
	type GraphicProfilePreset,
	parseGraphicProfilePresets,
	pickGraphicPresetValues,
} from './graphic-preset'

const preset = (id: string, label = id): GraphicProfilePreset => ({
	id,
	label,
	values: { rayDensity: 0.4 },
})

describe('parseGraphicProfilePresets', () => {
	it('Payload array 값을 프리셋 목록으로 읽는다', () => {
		expect(
			parseGraphicProfilePresets([
				{ presetId: 'hd-navy', label: 'HD 네이비', values: { rayDensity: 0.2 } },
			]),
		).toEqual([{ id: 'hd-navy', label: 'HD 네이비', values: { rayDensity: 0.2 } }])
	})

	it('배열이 아니면 빈 목록이다 — 필드를 만든 적 없는 프로파일이 그렇다', () => {
		expect(parseGraphicProfilePresets(undefined)).toEqual([])
		expect(parseGraphicProfilePresets(null)).toEqual([])
		expect(parseGraphicProfilePresets({})).toEqual([])
	})

	it('🔴 잘못된 항목은 버리고 나머지는 살린다 — 하나가 깨져 스튜디오가 안 뜨면 안 된다', () => {
		const parsed = parseGraphicProfilePresets([
			{ presetId: 'Bad Id', label: '대문자·공백', values: {} },
			{ presetId: 'no-label', values: {} },
			// 🔴 배열을 스프레드하면 런타임 입력이 조용히 깨진다.
			{ presetId: 'array-values', label: '배열', values: [1, 2] },
			{ presetId: 'null-values', label: 'null', values: null },
			{ presetId: 'good', label: '정상', values: { rayBloom: 0.5 } },
		])

		expect(parsed.map((entry) => entry.id)).toEqual(['good'])
	})

	it('식별자가 겹치면 앞엣것을 남긴다 — 목록 순서가 admin의 순서다', () => {
		const parsed = parseGraphicProfilePresets([
			{ presetId: 'dup', label: '먼저', values: {} },
			{ presetId: 'dup', label: '나중', values: {} },
		])

		expect(parsed).toHaveLength(1)
		expect(parsed[0]?.label).toBe('먼저')
	})
})

describe('findGraphicProfilePreset', () => {
	it('프로파일 프리셋이면 값 묶음을, 코드 프리셋이면 null을 준다', () => {
		const presets = [preset('hd-navy')]

		expect(findGraphicProfilePreset(presets, 'hd-navy')?.values).toEqual({ rayDensity: 0.4 })
		expect(findGraphicProfilePreset(presets, 'basic')).toBeNull()
		expect(findGraphicProfilePreset(presets, undefined)).toBeNull()
	})
})

describe('pickGraphicPresetValues', () => {
	const groups: readonly ControllerGroupDefinition[] = [
		{
			id: 'rays',
			title: 'Rays',
			controls: [
				{
					id: 'rayDensity',
					label: '광선 밀도',
					kind: 'range',
					defaultValue: 0.2,
					min: 0,
					max: 1,
					step: 0.01,
				},
				{ id: 'rayColor1', label: '광선 색상 1', kind: 'color', defaultValue: '#ffffff' },
			],
		},
	]

	it('노출된 컨트롤의 값만 남긴다', () => {
		expect(
			pickGraphicPresetValues(groups, {
				id: 'hd-navy',
				label: 'HD 네이비',
				values: { rayDensity: 0.4, rayColor1: '#001c4a' },
			}),
		).toEqual({ rayDensity: 0.4, rayColor1: '#001c4a' })
	})

	it('🔴 제한으로 사라진 컨트롤의 값은 버린다 — 안 보이는 축이 몰래 움직이면 안 된다', () => {
		expect(
			pickGraphicPresetValues(groups, {
				id: 'hd-navy',
				label: 'HD 네이비',
				values: { rayDensity: 0.4, glassBlur: 0.9 },
			}),
		).toEqual({ rayDensity: 0.4 })
	})

	it('🔴 컨트롤 계약을 벗어난 값도 버린다 — 프리셋을 만든 뒤 범위가 좁아질 수 있다', () => {
		expect(
			pickGraphicPresetValues(groups, {
				id: 'broken',
				label: '범위 밖',
				values: { rayDensity: 4, rayColor1: '#001c4a' },
			}),
		).toEqual({ rayColor1: '#001c4a' })
	})
})
