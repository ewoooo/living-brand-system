import { describe, expect, it } from 'vitest'
import type { ControllerGroupDefinition } from '@/modules/studio-controller/controller-definition'
import {
	findGraphicProfilePreset,
	GRAPHIC_PRESET_CONTROL_ID,
	type GraphicProfilePreset,
	mergeGraphicPresetOptions,
	parseGraphicProfilePresets,
	withProfilePresetOptions,
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

describe('mergeGraphicPresetOptions', () => {
	const code = [
		{ value: 'basic', label: '기본' },
		{ value: 'focused', label: '집중' },
	]

	it('코드 프리셋이 앞이고 프로파일 프리셋이 뒤에 붙는다', () => {
		expect(mergeGraphicPresetOptions(code, [preset('hd-navy', 'HD 네이비')])).toEqual([
			{ value: 'basic', label: '기본' },
			{ value: 'focused', label: '집중' },
			{ value: 'hd-navy', label: 'HD 네이비' },
		])
	})

	it('🔴 식별자가 겹치면 코드가 이긴다 — 런타임이 기대하는 조합이 사라지면 안 된다', () => {
		const merged = mergeGraphicPresetOptions(code, [preset('basic', '가로채기')])

		expect(merged).toHaveLength(2)
		expect(merged.find((option) => option.value === 'basic')?.label).toBe('기본')
	})

	it('프로파일 프리셋이 없으면 코드 목록 그대로다', () => {
		expect(mergeGraphicPresetOptions(code, [])).toEqual(code)
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

describe('withProfilePresetOptions', () => {
	const presetGroup: ControllerGroupDefinition = {
		id: 'preset',
		title: 'Preset',
		controls: [
			{
				id: GRAPHIC_PRESET_CONTROL_ID,
				label: '프리셋',
				kind: 'select',
				defaultValue: 'basic',
				options: [{ value: 'basic', label: '기본' }],
			},
		],
	}
	const plainGroup: ControllerGroupDefinition = {
		id: 'grid',
		title: 'Grid',
		controls: [
			{
				id: 'columnGap',
				label: '열 간격',
				kind: 'range',
				defaultValue: 30,
				min: 10,
				max: 30,
				step: 1,
			},
		],
	}

	it('프리셋 컨트롤이 있으면 그 선택지에 붙인다', () => {
		const [group] = withProfilePresetOptions([presetGroup], [preset('hd-navy', 'HD 네이비')])
		const control = group?.controls[0]

		expect(control?.kind === 'select' && control.options).toEqual([
			{ value: 'basic', label: '기본' },
			{ value: 'hd-navy', label: 'HD 네이비' },
		])
	})

	it('🔴 프리셋 컨트롤이 없는 런타임에서도 버리지 않고 그룹을 만들어 맨 앞에 세운다', () => {
		const groups = withProfilePresetOptions([plainGroup], [preset('hd-navy', 'HD 네이비')])

		expect(groups).toHaveLength(2)
		expect(groups[0]?.id).toBe(GRAPHIC_PRESET_CONTROL_ID)
		expect(groups[1]).toBe(plainGroup)
		const control = groups[0]?.controls[0]
		expect(control?.kind === 'select' && control.defaultValue).toBe('hd-navy')
	})

	it('프로파일 프리셋이 없으면 그룹을 그대로 돌려준다', () => {
		const groups = [presetGroup, plainGroup]

		expect(withProfilePresetOptions(groups, [])).toBe(groups)
	})

	it('프리셋과 무관한 컨트롤은 건드리지 않는다', () => {
		const [, group] = withProfilePresetOptions([presetGroup, plainGroup], [preset('hd-navy')])

		expect(group?.controls[0]).toEqual(plainGroup.controls[0])
	})
})
