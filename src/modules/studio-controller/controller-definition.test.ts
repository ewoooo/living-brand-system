import { describe, expect, it } from 'vitest'
import {
	acceptsControllerDraftValue,
	acceptsControllerExecutionValue,
	acceptsControllerExecutionValues,
	applyControllerRestrictions,
	type ControllerGroupDefinition,
	createControllerValues,
	isControllerPadValue,
	parseStudioControllerConfig,
	projectPayloadControllerRestrictions,
	resolveControllerPresentation,
} from './controller-definition'

describe('createControllerValues', () => {
	it('가변 그룹의 기본값을 control id 기준 세션 값으로 만든다', () => {
		const groups = [
			{
				id: 'graphic',
				title: 'Graphic',
				controls: [
					{ id: 'enabled', kind: 'toggle', label: 'Enabled', defaultValue: false },
					{
						id: 'origin',
						kind: 'pad',
						label: 'Origin',
						defaultValue: { x: 0, y: 0 },
					},
				],
			},
		] satisfies readonly ControllerGroupDefinition[]

		expect(createControllerValues(groups)).toEqual({
			enabled: false,
			origin: { x: 0, y: 0 },
		})
	})

	it('중복 control id가 앞 값을 조용히 덮어쓰지 못하게 한다', () => {
		const groups = [
			{
				id: 'one',
				title: 'One',
				controls: [{ id: 'same', kind: 'toggle', label: 'A', defaultValue: false }],
			},
			{
				id: 'two',
				title: 'Two',
				controls: [{ id: 'same', kind: 'toggle', label: 'B', defaultValue: true }],
			},
		] satisfies readonly ControllerGroupDefinition[]

		expect(() => createControllerValues(groups)).toThrow('same')
	})
})

describe('Controller draft와 execution 값 검증', () => {
	it('availability와 kind별 선택지·범위를 강제하되 text 길이는 세션에 보존한다', () => {
		expect(
			acceptsControllerDraftValue(
				{
					id: 'prompt',
					kind: 'text',
					label: 'Prompt',
					defaultValue: '',
					maxLength: 3,
				},
				'too long',
			),
		).toBe(true)
		expect(
			acceptsControllerDraftValue(
				{
					id: 'locked',
					kind: 'toggle',
					label: 'Locked',
					defaultValue: false,
					availability: 'readonly',
				},
				true,
			),
		).toBe(false)
		expect(
			acceptsControllerDraftValue(
				{
					id: 'ratio',
					kind: 'select',
					label: 'Ratio',
					defaultValue: '1:1',
					options: [{ value: '1:1', label: 'Square' }],
				},
				'16:9',
			),
		).toBe(false)
		expect(
			acceptsControllerDraftValue(
				{
					id: 'scale',
					kind: 'range',
					label: 'Scale',
					defaultValue: 1,
					min: 0,
					max: 2,
					step: 0.1,
				},
				3,
			),
		).toBe(false)
		expect(
			acceptsControllerDraftValue(
				{
					id: 'origin',
					kind: 'pad',
					label: 'Origin',
					defaultValue: { x: 0, y: 0 },
				},
				{ x: 2, y: 0 },
			),
		).toBe(false)
	})

	it('runtime binding을 정적 availability보다 느슨하게 만들지 않는다', () => {
		const control = {
			id: 'enabled',
			kind: 'toggle' as const,
			label: 'Enabled',
			defaultValue: false,
		}

		expect(acceptsControllerDraftValue(control, true, { availability: 'readonly' })).toBe(false)
		expect(
			acceptsControllerDraftValue({ ...control, availability: 'disabled' }, true, {
				availability: 'enabled',
			}),
		).toBe(false)
	})

	it('실행 경계는 초과 text를 거부하고 잠긴 control의 기본값만 허용한다', () => {
		const prompt = {
			id: 'prompt',
			kind: 'text' as const,
			label: 'Prompt',
			defaultValue: 'fixed',
			maxLength: 5,
			availability: 'readonly' as const,
		}

		expect(acceptsControllerExecutionValue(prompt, 'fixed')).toBe(true)
		expect(acceptsControllerExecutionValue(prompt, 'other')).toBe(false)
		expect(
			acceptsControllerExecutionValue({ ...prompt, availability: 'enabled' }, 'longer'),
		).toBe(false)
	})

	it('전체 실행값은 누락·초과 text·잠긴 값 변경을 거부한다', () => {
		const groups = [
			{
				id: 'text',
				title: 'Text',
				controls: [
					{
						id: 'title',
						kind: 'text' as const,
						label: 'Title',
						defaultValue: 'fixed',
						maxLength: 5,
						availability: 'readonly' as const,
					},
				],
			},
		]
		expect(acceptsControllerExecutionValues(groups, { title: 'fixed' })).toBe(true)
		expect(acceptsControllerExecutionValues(groups, {})).toBe(false)
		expect(acceptsControllerExecutionValues(groups, { title: 'other' })).toBe(false)
	})
})

describe('parseStudioControllerConfig', () => {
	it('공통 envelope와 모든 v1 control kind를 검증해 같은 계약을 반환한다', () => {
		const config = {
			studio: 'graphic',
			id: 'demo',
			version: 1,
			name: 'Demo',
			type: 'p5',
			artifacts: { vector: {} },
			controllerPresentation: {
				groups: [{ groupId: 'controls', collapsible: true, defaultOpen: false }],
			},
			controller: {
				groups: [
					{
						id: 'controls',
						title: 'Controls',
						controls: [
							{
								id: 'prompt',
								kind: 'text',
								label: 'Prompt',
								defaultValue: null,
								maxLength: 500,
							},
							{ id: 'enabled', kind: 'toggle', label: 'Enabled', defaultValue: true },
							{
								id: 'ratio',
								kind: 'select',
								label: 'Ratio',
								defaultValue: '1:1',
								options: [{ value: '1:1', label: 'Square' }],
							},
							{
								id: 'color',
								kind: 'color',
								label: 'Color',
								defaultValue: '#ffffff',
							},
							{
								id: 'scale',
								kind: 'range',
								label: 'Scale',
								defaultValue: 1,
								min: 0,
								max: 2,
								step: 0.1,
							},
							{
								id: 'origin',
								kind: 'pad',
								label: 'Origin',
								defaultValue: { x: 0, y: 0 },
								aspectRatio: 16 / 9,
							},
						],
					},
				],
			},
		}

		expect(parseStudioControllerConfig(config)).toBe(config)
	})

	it('공통 Runtime Artifact parser가 unknown kind를 거부한다', () => {
		expect(() =>
			parseStudioControllerConfig({
				...configWith({
					id: 'enabled',
					kind: 'toggle',
					label: 'Enabled',
					defaultValue: true,
				}),
				artifacts: { document: {} },
			}),
		).toThrow('Artifact 종류')
	})

	it('group과 전체 control id 중복을 거부한다', () => {
		expect(() =>
			parseStudioControllerConfig({
				...configWith({ id: 'same', kind: 'toggle', label: 'A', defaultValue: false }),
				controller: {
					groups: [
						{
							id: 'same',
							title: 'A',
							controls: [],
						},
						{
							id: 'same',
							title: 'B',
							controls: [],
						},
					],
				},
			}),
		).toThrow('중복')

		expect(() =>
			parseStudioControllerConfig({
				...configWith({ id: 'same', kind: 'toggle', label: 'A', defaultValue: false }),
				controller: {
					groups: [
						{
							id: 'one',
							title: 'One',
							controls: [
								{ id: 'same', kind: 'toggle', label: 'A', defaultValue: false },
							],
						},
						{
							id: 'two',
							title: 'Two',
							controls: [
								{ id: 'same', kind: 'toggle', label: 'B', defaultValue: true },
							],
						},
					],
				},
			}),
		).toThrow('same')
	})

	it.each([
		[
			'text max length',
			{
				id: 'prompt',
				kind: 'text',
				label: 'Prompt',
				defaultValue: 'too long',
				maxLength: 3,
			},
		],
		[
			'select default',
			{
				id: 'ratio',
				kind: 'select',
				label: 'Ratio',
				defaultValue: '16:9',
				options: [{ value: '1:1', label: 'Square' }],
			},
		],
		[
			'range bounds',
			{
				id: 'scale',
				kind: 'range',
				label: 'Scale',
				defaultValue: 1,
				min: 1,
				max: 1,
				step: 0.1,
			},
		],
		[
			'range finite',
			{
				id: 'scale',
				kind: 'range',
				label: 'Scale',
				defaultValue: Number.POSITIVE_INFINITY,
				min: 0,
				max: 2,
				step: 0.1,
			},
		],
		[
			'pad bounds',
			{
				id: 'origin',
				kind: 'pad',
				label: 'Origin',
				defaultValue: { x: 2, y: 0 },
			},
		],
		[
			'pad aspect ratio',
			{
				id: 'origin',
				kind: 'pad',
				label: 'Origin',
				defaultValue: { x: 0, y: 0 },
				aspectRatio: 0,
			},
		],
		['kind default', { id: 'enabled', kind: 'toggle', label: 'Enabled', defaultValue: 'yes' }],
	])('%s 위반을 거부한다', (_name, control) => {
		expect(() => parseStudioControllerConfig(configWith(control))).toThrow()
	})

	it('Controller 계약의 비직렬화 값을 거부한다', () => {
		expect(() =>
			parseStudioControllerConfig(
				configWith({
					id: 'enabled',
					kind: 'toggle',
					label: 'Enabled',
					defaultValue: false,
					formatter: () => 'No',
				}),
			),
		).toThrow('직렬화')
	})

	it.each([
		['문자열', 'future'],
		['boolean', true],
	])('직렬화 가능한 %s unknown control field도 거부한다', (_name, extra) => {
		expect(() =>
			parseStudioControllerConfig(
				configWith({
					id: 'enabled',
					kind: 'toggle',
					label: 'Enabled',
					defaultValue: false,
					extra,
				}),
			),
		).toThrow('지원하지 않는 필드')
	})
})

describe('isControllerPadValue', () => {
	it('유한한 -1~1 좌표만 허용한다', () => {
		expect(isControllerPadValue({ x: -1, y: 1 })).toBe(true)
		expect(isControllerPadValue({ x: Number.NaN, y: 0 })).toBe(false)
		expect(isControllerPadValue({ x: 1.1, y: 0 })).toBe(false)
	})
})

describe('Payload Controller projection과 Override 적용', () => {
	it('kind·표현 필드 없는 Override만 Base Definition보다 좁게 적용한다', () => {
		const base = [
			{
				id: 'setting',
				title: 'Setting',
				controls: [
					{
						id: 'ratio',
						kind: 'select' as const,
						label: 'Ratio',
						defaultValue: '1:1',
						options: [
							{ value: '1:1', label: 'Square' },
							{ value: '16:9', label: 'Wide' },
						],
					},
				],
			},
		] satisfies readonly ControllerGroupDefinition[]
		const restrictions = projectPayloadControllerRestrictions({
			controls: [
				{
					controlId: 'ratio',
					availability: 'readonly',
					defaultValue: '1:1',
					optionValues: ['1:1'],
				},
			],
		})
		const result = applyControllerRestrictions(base, restrictions)
		expect(result[0]).toMatchObject({ title: 'Setting' })
		expect(result[0]?.controls[0]).toMatchObject({
			kind: 'select',
			label: 'Ratio',
			availability: 'readonly',
			options: [{ value: '1:1', label: 'Square' }],
		})
		expect(() =>
			projectPayloadControllerRestrictions({
				controls: [{ controlId: 'ratio', kind: 'select' }],
			}),
		).toThrow('지원하지 않는 필드')
		expect(() =>
			projectPayloadControllerRestrictions({
				groups: [{ key: 'settings', controls: [] }],
			}),
		).toThrow('지원하지 않는 필드')
	})

	it('색 control은 자유 색상을 팔레트로 좁히고 목록 밖 색을 실행에서 막는다', () => {
		const base = [
			{
				id: 'profile-settings',
				title: 'Profile Settings',
				controls: [
					{
						id: 'lineColor',
						kind: 'color' as const,
						label: 'Line Color',
						defaultValue: null,
					},
				],
			},
		] satisfies readonly ControllerGroupDefinition[]
		const narrowed = applyControllerRestrictions(
			base,
			projectPayloadControllerRestrictions({
				controls: [{ controlId: 'lineColor', colorValues: ['#FF0000', '#00ff00'] }],
			}),
		)
		const control = narrowed[0]?.controls[0]
		if (control?.kind !== 'color') throw new Error('color control이 필요합니다.')
		// hex 대소문자는 같은 색이다 — 목록은 소문자로 정규화된다.
		expect(control.values).toEqual(['#ff0000', '#00ff00'])
		expect(acceptsControllerExecutionValue(control, '#ff0000')).toBe(true)
		expect(acceptsControllerExecutionValue(control, '#0000ff')).toBe(false)
	})

	it('팔레트를 이미 가진 색 control을 넓히려 하면 거부한다', () => {
		const base = [
			{
				id: 'profile-settings',
				title: 'Profile Settings',
				controls: [
					{
						id: 'lineColor',
						kind: 'color' as const,
						label: 'Line Color',
						defaultValue: '#ff0000',
						values: ['#ff0000'],
					},
				],
			},
		] satisfies readonly ControllerGroupDefinition[]
		expect(() =>
			applyControllerRestrictions(
				base,
				projectPayloadControllerRestrictions({
					controls: [{ controlId: 'lineColor', colorValues: ['#ff0000', '#0000ff'] }],
				}),
			),
		).toThrow('colorValues가 기본 계약을 확장합니다')
	})
})

describe('Controller group presentation', () => {
	const groups = [
		{ id: 'first', title: 'First', controls: [] },
		{ id: 'second', title: 'Second', controls: [] },
	] satisfies readonly ControllerGroupDefinition[]

	it('Admin sparse 값을 Runtime 순서의 완전한 Creator 정책으로 해석한다', () => {
		expect(
			resolveControllerPresentation(groups, {
				groups: [{ groupId: 'second', defaultOpen: false }],
			}),
		).toEqual({
			groups: [
				{ groupId: 'first', collapsible: true, defaultOpen: true },
				{ groupId: 'second', collapsible: true, defaultOpen: false },
			],
		})
	})

	it('알 수 없는 그룹과 닫힌 static 그룹을 거부한다', () => {
		expect(() =>
			resolveControllerPresentation(groups, {
				groups: [{ groupId: 'missing', defaultOpen: false }],
			}),
		).toThrow('찾을 수 없습니다')
		expect(() =>
			resolveControllerPresentation(groups, {
				groups: [{ groupId: 'first', collapsible: false, defaultOpen: false }],
			}),
		).toThrow('닫힌 상태')
	})
})

function configWith(control: unknown) {
	return {
		studio: 'graphic',
		id: 'demo',
		version: 1,
		name: 'Demo',
		artifacts: { vector: {} },
		controller: {
			groups: [{ id: 'controls', title: 'Controls', controls: [control] }],
		},
	}
}
