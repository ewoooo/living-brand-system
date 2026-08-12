/** Controller Definition에 저장할 수 있는 직렬화 가능한 값. */
export type ControllerControlValue = string | number | boolean | null | ControllerPadValue

export type ControllerPadValue = { x: number; y: number }

export type ControllerAvailability = 'enabled' | 'readonly' | 'disabled'
export type ControllerInteraction = 'idle' | 'hover' | 'focused' | 'error'

export type ControllerRuntimeBinding = {
	availability?: ControllerAvailability
	error?: string
	padAspectRatio?: number
}

export type ControllerRuntimeBindings = Readonly<Record<string, ControllerRuntimeBinding>>

export type StudioKind = 'template' | 'image' | 'graphic'

/** 모든 Studio가 발행하는 공통 Controller envelope. 도메인 실행 정보는 교차 타입으로 확장한다. */
export type StudioControllerConfig<
	Kind extends StudioKind = StudioKind,
	Id extends string | number = string | number,
> = {
	studio: Kind
	id: Id
	version: 1
	name: string
	controller: {
		groups: readonly ControllerGroupDefinition[]
	}
}

export type ControllerOption<Value extends string = string> = {
	value: Value
	label: string
}

type ControllerControlBase = {
	id: string
	label: string
	availability?: ControllerAvailability
}

/**
 * Controller primitive가 받을 수 있는 데이터 정의. 현재 값·콜백·상호작용 상태는 Studio Provider와
 * 표현 컴포넌트가 결합하고, 이 계약에는 직렬화 가능한 기본값과 제약만 둔다.
 */
export type ControllerControlDefinition =
	| (ControllerControlBase & {
			kind: 'text'
			defaultValue: string | null
			multiline?: boolean
			maxLength?: number
			placeholder?: string
	  })
	| (ControllerControlBase & {
			kind: 'toggle'
			defaultValue: boolean
	  })
	| (ControllerControlBase & {
			kind: 'select'
			defaultValue: string | null
			options: readonly ControllerOption[]
			placeholder?: string
	  })
	| (ControllerControlBase & {
			kind: 'color'
			defaultValue: string | null
	  })
	| (ControllerControlBase & {
			kind: 'range'
			defaultValue: number
			min: number
			max: number
			step: number
			display?: { unit?: string; precision?: number }
	  })
	| (ControllerControlBase & {
			kind: 'pad'
			defaultValue: ControllerPadValue
			aspectRatio?: number
	  })

export type ControllerGroupDefinition = {
	id: string
	title: string
	controls: readonly ControllerControlDefinition[]
} & ({ collapsible?: false; defaultOpen?: never } | { collapsible: true; defaultOpen?: boolean })

export type ControllerValues = Record<string, ControllerControlValue>

const STUDIO_KINDS: readonly StudioKind[] = ['template', 'image', 'graphic']
const AVAILABILITIES: readonly ControllerAvailability[] = ['enabled', 'readonly', 'disabled']
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i
const CONTROL_BASE_KEYS = ['id', 'kind', 'label', 'defaultValue', 'availability'] as const

/** unknown Admin/Payload 입력에서 공통 envelope와 Controller Definition v1을 검증한다. */
export function parseStudioControllerConfig(input: unknown): StudioControllerConfig {
	const config = asRecord(input, 'StudioConfig')
	assertJsonValue(config.controller, 'controller')

	if (!STUDIO_KINDS.includes(config.studio as StudioKind))
		invalid('studio', '지원하지 않는 값입니다.')
	if (
		(typeof config.id !== 'string' || config.id.length === 0) &&
		(typeof config.id !== 'number' || !Number.isFinite(config.id))
	) {
		invalid('id', '비어 있지 않은 문자열 또는 유한한 숫자여야 합니다.')
	}
	if (config.version !== 1) invalid('version', '지원하는 버전은 1입니다.')
	assertNonEmptyString(config.name, 'name')

	const controller = asRecord(config.controller, 'controller')
	assertOnlyKeys(controller, ['groups'], 'controller')
	if (!Array.isArray(controller.groups)) invalid('controller.groups', '배열이어야 합니다.')

	const groupIds = new Set<string>()
	for (const [groupIndex, groupValue] of controller.groups.entries()) {
		const groupPath = `controller.groups[${groupIndex}]`
		const group = asRecord(groupValue, groupPath)
		assertOnlyKeys(group, ['id', 'title', 'controls', 'collapsible', 'defaultOpen'], groupPath)
		assertNonEmptyString(group.id, `${groupPath}.id`)
		if (groupIds.has(group.id)) invalid(`${groupPath}.id`, `중복되었습니다: ${group.id}`)
		groupIds.add(group.id)
		assertNonEmptyString(group.title, `${groupPath}.title`)
		if (!Array.isArray(group.controls)) invalid(`${groupPath}.controls`, '배열이어야 합니다.')
		if (group.collapsible !== undefined && typeof group.collapsible !== 'boolean') {
			invalid(`${groupPath}.collapsible`, 'boolean이어야 합니다.')
		}
		if (group.defaultOpen !== undefined) {
			if (group.collapsible !== true) {
				invalid(`${groupPath}.defaultOpen`, 'collapsible 그룹에서만 사용할 수 있습니다.')
			}
			if (typeof group.defaultOpen !== 'boolean') {
				invalid(`${groupPath}.defaultOpen`, 'boolean이어야 합니다.')
			}
		}

		for (const [controlIndex, controlValue] of group.controls.entries()) {
			validateControl(controlValue, `${groupPath}.controls[${controlIndex}]`)
		}
	}

	createControllerValues(controller.groups as readonly ControllerGroupDefinition[])
	return input as StudioControllerConfig
}

/** Payload array/block 저장형의 key·blockType을 공개 Controller Definition으로 정규화한다. */
export function projectPayloadController(
	input: unknown,
): StudioControllerConfig['controller'] | null {
	if (!input || typeof input !== 'object') return null
	const groups = (input as { groups?: unknown }).groups
	if (groups == null || (Array.isArray(groups) && groups.length === 0)) return null
	if (!Array.isArray(groups)) invalid('controller.groups', '배열이어야 합니다.')

	return {
		groups: groups.map((value) => {
			const group = asRecord(value, 'controller group')
			if (!Array.isArray(group.controls)) {
				invalid('controller group.controls', '배열이어야 합니다.')
			}
			const collapsible = group.collapsible === true
			return {
				id: group.key as string,
				title: group.title as string,
				controls: group.controls.map(projectPayloadControl),
				...(collapsible
					? {
							collapsible: true as const,
							...(typeof group.defaultOpen === 'boolean'
								? { defaultOpen: group.defaultOpen }
								: {}),
						}
					: {}),
			}
		}) as readonly ControllerGroupDefinition[],
	}
}

/** Admin Definition이 runtime/Template 기본 계약을 확장하지 않고 같은 ID의 제약만 좁힌다. */
export function narrowControllerGroups(
	baseGroups: readonly ControllerGroupDefinition[],
	overrideGroups: readonly ControllerGroupDefinition[],
): readonly ControllerGroupDefinition[] {
	const baseById = new Map(baseGroups.map((group) => [group.id, group]))
	for (const group of overrideGroups) {
		const base = baseById.get(group.id)
		if (!base) throw new Error(`Controller override group을 찾을 수 없습니다: ${group.id}`)
		const baseControlIds = new Set(base.controls.map((control) => control.id))
		for (const control of group.controls) {
			if (!baseControlIds.has(control.id)) {
				throw new Error(`Controller override control을 찾을 수 없습니다: ${control.id}`)
			}
		}
	}

	return baseGroups.map((baseGroup) => {
		const overrideGroup = overrideGroups.find((group) => group.id === baseGroup.id)
		if (!overrideGroup) return baseGroup
		const overrides = new Map(
			overrideGroup.controls.map((control) => [control.id, control] as const),
		)
		const controls = baseGroup.controls.map((base) => {
			const override = overrides.get(base.id)
			return override ? narrowControl(base, override) : base
		})
		return overrideGroup.collapsible
			? {
					id: baseGroup.id,
					title: overrideGroup.title,
					controls,
					collapsible: true as const,
					...(overrideGroup.defaultOpen === undefined
						? {}
						: { defaultOpen: overrideGroup.defaultOpen }),
				}
			: { id: baseGroup.id, title: overrideGroup.title, controls }
	})
}

/** Definition의 기본값으로 편집 세션을 시작한다. 중복 id는 값 덮어쓰기를 막기 위해 거부한다. */
export function createControllerValues(
	groups: readonly ControllerGroupDefinition[],
): ControllerValues {
	const values: ControllerValues = {}
	for (const group of groups) {
		for (const control of group.controls) {
			if (control.id in values) {
				throw new Error(`Controller control id가 중복되었습니다: ${control.id}`)
			}
			values[control.id] = control.defaultValue
		}
	}
	return values
}

/** Controller Definition이 조작 가능한 값만 세션에 받는다. text 길이 오류는 표시를 위해 보존한다. */
export function acceptsControllerValue(
	control: ControllerControlDefinition,
	value: ControllerControlValue,
): boolean {
	if ((control.availability ?? 'enabled') !== 'enabled') return false
	switch (control.kind) {
		case 'text':
			return typeof value === 'string' || value === null
		case 'toggle':
			return typeof value === 'boolean'
		case 'select':
			return (
				value === null ||
				(typeof value === 'string' &&
					control.options.some((option) => option.value === value))
			)
		case 'color':
			return value === null || (typeof value === 'string' && COLOR_PATTERN.test(value))
		case 'range':
			return (
				typeof value === 'number' &&
				Number.isFinite(value) &&
				value >= control.min &&
				value <= control.max
			)
		case 'pad':
			return isControllerPadValue(value)
	}
}

export function isControllerPadValue(value: ControllerControlValue): value is ControllerPadValue {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof value.x === 'number' &&
		Number.isFinite(value.x) &&
		value.x >= -1 &&
		value.x <= 1 &&
		typeof value.y === 'number' &&
		Number.isFinite(value.y) &&
		value.y >= -1 &&
		value.y <= 1
	)
}

function validateControl(value: unknown, path: string) {
	const control = asRecord(value, path)
	assertNonEmptyString(control.id, `${path}.id`)
	assertNonEmptyString(control.label, `${path}.label`)
	if (
		control.availability !== undefined &&
		!AVAILABILITIES.includes(control.availability as ControllerAvailability)
	) {
		invalid(`${path}.availability`, '지원하지 않는 값입니다.')
	}

	switch (control.kind) {
		case 'text':
			assertOnlyKeys(
				control,
				[...CONTROL_BASE_KEYS, 'multiline', 'maxLength', 'placeholder'],
				path,
			)
			assertNullableString(control.defaultValue, `${path}.defaultValue`)
			if (control.multiline !== undefined && typeof control.multiline !== 'boolean') {
				invalid(`${path}.multiline`, 'boolean이어야 합니다.')
			}
			if (
				control.maxLength !== undefined &&
				(typeof control.maxLength !== 'number' ||
					!Number.isInteger(control.maxLength) ||
					control.maxLength <= 0)
			) {
				invalid(`${path}.maxLength`, '0보다 큰 정수여야 합니다.')
			}
			if (
				typeof control.defaultValue === 'string' &&
				typeof control.maxLength === 'number' &&
				control.defaultValue.length > control.maxLength
			) {
				invalid(`${path}.defaultValue`, 'maxLength를 초과할 수 없습니다.')
			}
			if (control.placeholder !== undefined && typeof control.placeholder !== 'string') {
				invalid(`${path}.placeholder`, '문자열이어야 합니다.')
			}
			return
		case 'toggle':
			assertOnlyKeys(control, CONTROL_BASE_KEYS, path)
			if (typeof control.defaultValue !== 'boolean') {
				invalid(`${path}.defaultValue`, 'boolean이어야 합니다.')
			}
			return
		case 'select': {
			assertOnlyKeys(control, [...CONTROL_BASE_KEYS, 'options', 'placeholder'], path)
			assertNullableString(control.defaultValue, `${path}.defaultValue`)
			if (!Array.isArray(control.options) || control.options.length === 0) {
				invalid(`${path}.options`, '하나 이상의 선택지가 필요합니다.')
			}
			const optionValues = new Set<string>()
			for (const [optionIndex, optionValue] of control.options.entries()) {
				const optionPath = `${path}.options[${optionIndex}]`
				const option = asRecord(optionValue, optionPath)
				assertOnlyKeys(option, ['value', 'label'], optionPath)
				assertNonEmptyString(option.value, `${optionPath}.value`)
				assertNonEmptyString(option.label, `${optionPath}.label`)
				if (optionValues.has(option.value)) {
					invalid(`${optionPath}.value`, `중복되었습니다: ${option.value}`)
				}
				optionValues.add(option.value)
			}
			if (control.defaultValue !== null && !optionValues.has(control.defaultValue)) {
				invalid(`${path}.defaultValue`, 'options에 포함되어야 합니다.')
			}
			if (control.placeholder !== undefined && typeof control.placeholder !== 'string') {
				invalid(`${path}.placeholder`, '문자열이어야 합니다.')
			}
			return
		}
		case 'color':
			assertOnlyKeys(control, CONTROL_BASE_KEYS, path)
			assertNullableString(control.defaultValue, `${path}.defaultValue`)
			if (control.defaultValue !== null && !COLOR_PATTERN.test(control.defaultValue)) {
				invalid(`${path}.defaultValue`, '#rrggbb 형식이어야 합니다.')
			}
			return
		case 'range':
			assertOnlyKeys(control, [...CONTROL_BASE_KEYS, 'min', 'max', 'step', 'display'], path)
			assertNumber(control.defaultValue, `${path}.defaultValue`)
			assertNumber(control.min, `${path}.min`)
			assertNumber(control.max, `${path}.max`)
			assertNumber(control.step, `${path}.step`)
			if (control.min >= control.max) invalid(path, 'range의 min은 max보다 작아야 합니다.')
			if (control.step <= 0) invalid(`${path}.step`, '0보다 커야 합니다.')
			if (control.defaultValue < control.min || control.defaultValue > control.max) {
				invalid(`${path}.defaultValue`, 'min과 max 사이여야 합니다.')
			}
			if (control.display !== undefined) {
				const display = asRecord(control.display, `${path}.display`)
				assertOnlyKeys(display, ['unit', 'precision'], `${path}.display`)
				if (display.unit !== undefined && typeof display.unit !== 'string') {
					invalid(`${path}.display.unit`, '문자열이어야 합니다.')
				}
				if (
					display.precision !== undefined &&
					(typeof display.precision !== 'number' ||
						!Number.isInteger(display.precision) ||
						display.precision < 0)
				) {
					invalid(`${path}.display.precision`, '0 이상의 정수여야 합니다.')
				}
			}
			return
		case 'pad': {
			assertOnlyKeys(control, [...CONTROL_BASE_KEYS, 'aspectRatio'], path)
			const point = asRecord(control.defaultValue, `${path}.defaultValue`)
			assertOnlyKeys(point, ['x', 'y'], `${path}.defaultValue`)
			assertNumber(point.x, `${path}.defaultValue.x`)
			assertNumber(point.y, `${path}.defaultValue.y`)
			if (point.x < -1 || point.x > 1 || point.y < -1 || point.y > 1) {
				invalid(`${path}.defaultValue`, 'x와 y는 -1에서 1 사이여야 합니다.')
			}
			if (control.aspectRatio !== undefined) {
				assertNumber(control.aspectRatio, `${path}.aspectRatio`)
				if (control.aspectRatio <= 0) invalid(`${path}.aspectRatio`, '0보다 커야 합니다.')
			}
			return
		}
		default:
			invalid(`${path}.kind`, '지원하지 않는 값입니다.')
	}
}

function projectPayloadControl(value: unknown): ControllerControlDefinition {
	const control = asRecord(value, 'controller control')
	const base = {
		id: control.key as string,
		label: control.label as string,
		...optionalProperty(
			'availability',
			control.availability as ControllerControlDefinition['availability'],
		),
	}

	switch (control.blockType) {
		case 'text':
			return {
				...base,
				kind: 'text',
				defaultValue: (control.defaultValue ?? null) as string | null,
				...optionalProperty('multiline', control.multiline as boolean | undefined),
				...optionalProperty('maxLength', control.maxLength as number | undefined),
				...optionalProperty('placeholder', control.placeholder as string | undefined),
			}
		case 'toggle':
			return {
				...base,
				kind: 'toggle',
				defaultValue: control.defaultValue as boolean,
			}
		case 'select': {
			if (!Array.isArray(control.options)) {
				invalid('controller select.options', '배열이어야 합니다.')
			}
			return {
				...base,
				kind: 'select',
				defaultValue: (control.defaultValue ?? null) as string | null,
				options: control.options.map((value) => {
					const option = asRecord(value, 'controller select option')
					return { value: option.value as string, label: option.label as string }
				}),
				...optionalProperty('placeholder', control.placeholder as string | undefined),
			}
		}
		case 'color':
			return {
				...base,
				kind: 'color',
				defaultValue: (control.defaultValue ?? null) as string | null,
			}
		case 'range': {
			const display = control.display
			return {
				...base,
				kind: 'range',
				defaultValue: control.defaultValue as number,
				min: control.min as number,
				max: control.max as number,
				step: control.step as number,
				...(display && typeof display === 'object'
					? {
							display: {
								...optionalProperty(
									'unit',
									(display as Record<string, unknown>).unit as string | undefined,
								),
								...optionalProperty(
									'precision',
									(display as Record<string, unknown>).precision as
										| number
										| undefined,
								),
							},
						}
					: {}),
			}
		}
		case 'pad': {
			const defaultValue = asRecord(control.defaultValue, 'controller pad.defaultValue')
			return {
				...base,
				kind: 'pad',
				defaultValue: { x: defaultValue.x as number, y: defaultValue.y as number },
				...optionalProperty('aspectRatio', control.aspectRatio as number | undefined),
			}
		}
		default:
			invalid('controller control.blockType', '지원하지 않는 값입니다.')
	}
}

function narrowControl(
	base: ControllerControlDefinition,
	override: ControllerControlDefinition,
): ControllerControlDefinition {
	if (base.kind !== override.kind) {
		throw new Error(`Controller override kind가 다릅니다: ${override.id}`)
	}
	const availabilityRank: Record<ControllerAvailability, number> = {
		enabled: 0,
		readonly: 1,
		disabled: 2,
	}
	if (
		availabilityRank[override.availability ?? 'enabled'] <
		availabilityRank[base.availability ?? 'enabled']
	) {
		throw new Error(`Controller override availability가 기본 계약을 확장합니다: ${override.id}`)
	}

	switch (base.kind) {
		case 'text': {
			const next = override as Extract<ControllerControlDefinition, { kind: 'text' }>
			if (
				base.maxLength !== undefined &&
				(next.maxLength === undefined || next.maxLength > base.maxLength)
			) {
				throw new Error(
					`Controller override maxLength가 기본 계약을 확장합니다: ${override.id}`,
				)
			}
			return next
		}
		case 'select': {
			const next = override as Extract<ControllerControlDefinition, { kind: 'select' }>
			const allowed = new Set(base.options.map((option) => option.value))
			if (next.options.some((option) => !allowed.has(option.value))) {
				throw new Error(
					`Controller override options가 기본 계약을 확장합니다: ${override.id}`,
				)
			}
			return next
		}
		case 'range': {
			const next = override as Extract<ControllerControlDefinition, { kind: 'range' }>
			if (next.min < base.min || next.max > base.max) {
				throw new Error(
					`Controller override range가 기본 계약을 확장합니다: ${override.id}`,
				)
			}
			return next
		}
		default:
			return override
	}
}

function assertJsonValue(value: unknown, path: string, ancestors = new Set<object>()) {
	if (value === null || typeof value === 'string' || typeof value === 'boolean') return
	if (typeof value === 'number') {
		assertNumber(value, path)
		return
	}
	if (typeof value !== 'object') invalid(path, 'JSON으로 직렬화할 수 없는 값입니다.')
	if (ancestors.has(value)) invalid(path, '순환 참조는 허용하지 않습니다.')
	ancestors.add(value)
	if (Array.isArray(value)) {
		for (const [index, item] of value.entries())
			assertJsonValue(item, `${path}[${index}]`, ancestors)
	} else {
		const prototype = Object.getPrototypeOf(value)
		if (prototype !== Object.prototype && prototype !== null) {
			invalid(path, 'JSON 객체여야 합니다.')
		}
		for (const [key, item] of Object.entries(value)) {
			assertJsonValue(item, `${path}.${key}`, ancestors)
		}
	}
	ancestors.delete(value)
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		invalid(path, '객체여야 합니다.')
	}
	return value as Record<string, unknown>
}

function assertOnlyKeys(value: Record<string, unknown>, allowed: readonly string[], path: string) {
	const allowedKeys = new Set(allowed)
	for (const key of Object.keys(value)) {
		if (!allowedKeys.has(key)) invalid(`${path}.${key}`, '지원하지 않는 필드입니다.')
	}
}

function assertNonEmptyString(value: unknown, path: string): asserts value is string {
	if (typeof value !== 'string' || value.length === 0)
		invalid(path, '비어 있지 않은 문자열이어야 합니다.')
}

function assertNullableString(value: unknown, path: string): asserts value is string | null {
	if (value !== null && typeof value !== 'string') invalid(path, '문자열 또는 null이어야 합니다.')
}

function assertNumber(value: unknown, path: string): asserts value is number {
	if (typeof value !== 'number' || !Number.isFinite(value))
		invalid(path, '유한한 숫자여야 합니다.')
}

function invalid(path: string, message: string): never {
	throw new Error(`StudioControllerConfig ${path}: ${message}`)
}

function optionalProperty<Key extends string, Value>(key: Key, value: Value | null | undefined) {
	return value == null ? {} : ({ [key]: value } as Record<Key, Value>)
}
