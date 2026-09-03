import {
	parseStudioArtifactCapabilities,
	type StudioArtifactCapabilities,
} from '@/modules/studio-artifact/studio-artifact'

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

/** Admin 제한을 적용하기 전 Studio runtime이 발행하는 결정적 원본 계약. */
export type StudioRuntimeManifest = {
	artifacts: StudioArtifactCapabilities
	controller: {
		groups: readonly ControllerGroupDefinition[]
		/**
		 * 왼쪽 패널에 세울 컨트롤 id — 창작자가 **실제로 다루기를 기대하는** 큰 축이다.
		 * 색 조합과 전반적인 형태가 여기 온다.
		 *
		 * 나머지는 사라지지 않고 **오른쪽 패널**로 간다 — 세기·속도처럼 세밀하고 잡다한 값들이고,
		 * 창작자가 다룰 수는 있으나 다루리라 기대하지는 않는다.
		 *
		 * 🔴 **비워 두면 전부 왼쪽이다.** 아직 정하지 않은 런타임은 선언하지 않는다 —
		 *    빈 배열을 넣으면 왼쪽 패널이 통째로 빈다.
		 *
		 * 지금은 코드가 정하지만 나중에 프로파일(manager)로 옮겨진다. `controllerPresentation`이
		 * 같은 성격으로 이미 그 길을 갔다.
		 */
		left?: readonly string[]
		/**
		 * 오른쪽 패널에 세울 컨트롤 id — 창작자가 다룰 수는 있으나 다루리라 기대하지 않는 축이다.
		 *
		 * 🔑 **여기에도 `left`에도 없는 컨트롤은 창작자 화면에 그려지지 않는다.** 선언은 남아 있어
		 *    manager가 Payload에서 조정할 수 있다 — 지우는 것이 아니라 후처리 자리로 내리는 것이다.
		 *
		 * 🔴 비워 두면 `left`가 아닌 전부가 오른쪽이다. 아직 정하지 않은 런타임의 축이 조용히
		 *    사라지지 않게 한다 — 빈 배열은 「오른쪽에 아무것도 세우지 않는다」는 뜻이다.
		 */
		right?: readonly string[]
		/**
		 * 값이 바뀌면 런타임을 **다시 만들어야** 하는 컨트롤 id.
		 *
		 * 대부분의 컨트롤은 uniform 하나를 바꾸므로 살아 있는 런타임에 흘려 넣으면 된다. 그런데
		 * 「모양」처럼 셰이더 프로그램 자체를 갈아끼우는 축은 update로 반영할 수 없다 — 컴파일된
		 * 프로그램에 없는 uniform은 조용히 무시되고 화면만 옛 모양으로 남는다.
		 *
		 * 🔴 여기 넣은 컨트롤은 만질 때마다 캔버스가 처음부터 다시 뜬다(애니메이션도 되감긴다).
		 *    그 값이 프로그램을 바꾸는 축일 때만 넣는다.
		 */
		remountOn?: readonly string[]
	}
}

/**
 * Admin이 등록한 미리보기 이미지의 표시 계약 — 자산 브라우저 카드와 트리거 배경이 쓴다.
 * 업로드 문서 원본이 아니라 표시에 필요한 두 값만 지난다(docs/07: 안전 계약 필드만 나간다).
 */
export type StudioPreviewImage = {
	url: string
	alt: string
}

/** 모든 Studio가 발행하는 공통 Controller envelope. 도메인 실행 정보는 교차 타입으로 확장한다. */
export type StudioControllerConfig<
	Kind extends StudioKind = StudioKind,
	Id extends string | number = string | number,
> = StudioRuntimeManifest & {
	studio: Kind
	id: Id
	version: 1
	name: string
	/** Runtime 구조와 분리해 Admin이 정한 그룹 표현 정책. Runtime Manifest에는 존재하지 않는다. */
	controllerPresentation?: StudioControllerPresentation
	/** Admin이 고른 미리보기 이미지. Runtime Manifest에는 존재하지 않는다(프로파일·템플릿이 갖는다). */
	previewImage?: StudioPreviewImage
}

export type ControllerOption<Value extends string = string> = {
	value: Value
	label: string
	/**
	 * 이 선택지가 곧 색 조합일 때의 실제 색(#rrggbb). 🔴 새 kind도 새 variant도 만들지 않는다 —
	 * `variant`는 선택지의 **성격**이고 이것은 선택지의 **내용**이다.
	 * 한 control의 선택지는 전부 갖거나 전부 없어야 한다 — 섞이면 색 칩과 글자 목록이 반쪽으로 그려진다.
	 */
	colors?: readonly string[]
	/**
	 * 이 선택지가 곧 형태일 때 그 형태를 그리는 선분 목록. 한 선분은 단위 정사각형(0~1) 안의
	 * `[x1, y1, x2, y2]`이고, 킷이 그것을 SVG로 그려 썸네일을 만든다.
	 *
	 * 🔑 이미지가 아니라 **좌표**인 이유: 파일을 두면 이 축이 admin 업로드에 묶여 환경마다 달라지고,
	 * 아이콘 이름을 두면 킷이 런타임의 어휘를 알아야 한다. 좌표는 런타임이 자기 기하를 그대로
	 * 적는 것이라 둘 다 피한다.
	 * `colors`와 마찬가지로 한 control의 선택지는 전부 갖거나 전부 없어야 한다.
	 */
	preview?: readonly (readonly [number, number, number, number])[]
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
			/**
			 * 선택지를 어떻게 내놓는가. 기본 `list`는 드롭다운이라 **누르기 전까지 무엇이 있는지 모른다**.
			 * `segmented`는 선택지를 한 줄에 다 펴 놓고 배경 pill만 미끄러진다 — 선택지가 몇 개인지가
			 * 곧 정보인 축(꼴처럼 정본이 세트로 제시하는 것)에 쓴다. 선택지가 많으면 폭을 먹으므로
			 * 목록형이 기본이다.
			 */
			variant?: 'list' | 'segmented'
	  })
	| (ControllerControlBase & {
			kind: 'color'
			defaultValue: string | null
			/** 허용 색 목록(#rrggbb). 없으면 자유 색상이다 — select의 options에 대응한다. */
			values?: readonly string[]
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
}

/**
 * 그룹을 왼쪽/오른쪽 두 벌로 가른다. 그룹 구조는 양쪽에서 그대로 유지되고,
 * 남는 컨트롤이 없는 그룹은 그 쪽에서 빠진다.
 *
 * 🔑 **어느 쪽에도 없는 컨트롤은 어느 쪽에도 그려지지 않는다** — 선언은 남으므로 manager는
 *    Payload에서 그 값을 조정할 수 있다. 창작자 화면에서만 내려가는 세 번째 층이다.
 *
 * 🔴 `left`가 없으면 전부 왼쪽이다 — 선언하지 않은 런타임의 화면이 비지 않게 한다.
 * 🔴 `right`가 없으면 왼쪽이 아닌 전부가 오른쪽이다. 빈 배열은 그것과 다르다 —
 *    「오른쪽에 아무것도 세우지 않는다」는 뜻이다.
 */
export function splitControllerGroups(
	groups: readonly ControllerGroupDefinition[],
	left: readonly string[] | undefined,
	right?: readonly string[],
): { left: readonly ControllerGroupDefinition[]; right: readonly ControllerGroupDefinition[] } {
	if (!left) return { left: groups, right: [] }
	const leftIds = new Set(left)
	const rightIds = right && new Set(right)
	const pick = (side: 'left' | 'right') =>
		groups
			.map((group) => ({
				...group,
				controls: group.controls.filter((control) =>
					side === 'left'
						? leftIds.has(control.id)
						: rightIds
							? rightIds.has(control.id)
							: !leftIds.has(control.id),
				),
			}))
			.filter((group) => group.controls.length > 0)

	return { left: pick('left'), right: pick('right') }
}

export type ControllerGroupPresentation = {
	groupId: string
	collapsible: boolean
	defaultOpen: boolean
}

export type StudioControllerPresentation = {
	groups: readonly ControllerGroupPresentation[]
}

/** Base Definition의 kind·표현 정보를 복제하지 않는 Admin 제한값. */
export type ControllerControlRestriction = {
	controlId: string
	availability?: Exclude<ControllerAvailability, 'enabled'>
	defaultValue?: ControllerControlValue
	maxLength?: number
	optionValues?: readonly string[]
	/** color control의 허용 색 좁힘 — optionValues의 색 버전이다. */
	colorValues?: readonly string[]
	min?: number
	max?: number
}

export type StudioControllerRestrictions = {
	controls: readonly ControllerControlRestriction[]
}

export type ControllerValues = Record<string, ControllerControlValue>

const STUDIO_KINDS: readonly StudioKind[] = ['template', 'image', 'graphic']
const AVAILABILITIES: readonly ControllerAvailability[] = ['enabled', 'readonly', 'disabled']
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i
const CONTROL_BASE_KEYS = ['id', 'kind', 'label', 'defaultValue', 'availability'] as const
type SelectVariant = NonNullable<
	Extract<ControllerControlDefinition, { kind: 'select' }>['variant']
>
const SELECT_VARIANTS: readonly SelectVariant[] = ['list', 'segmented']

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
	if (config.previewImage != null) validatePreviewImage(config.previewImage)
	parseStudioArtifactCapabilities(config.artifacts)

	const controller = asRecord(config.controller, 'controller')
	assertOnlyKeys(controller, ['groups', 'left', 'remountOn', 'right'], 'controller')
	if (!Array.isArray(controller.groups)) invalid('controller.groups', '배열이어야 합니다.')

	const groupIds = new Set<string>()
	const controlIds = new Set<string>()
	for (const [groupIndex, groupValue] of controller.groups.entries()) {
		const groupPath = `controller.groups[${groupIndex}]`
		const group = asRecord(groupValue, groupPath)
		assertOnlyKeys(group, ['id', 'title', 'controls'], groupPath)
		assertNonEmptyString(group.id, `${groupPath}.id`)
		if (groupIds.has(group.id)) invalid(`${groupPath}.id`, `중복되었습니다: ${group.id}`)
		groupIds.add(group.id)
		assertNonEmptyString(group.title, `${groupPath}.title`)
		if (!Array.isArray(group.controls)) invalid(`${groupPath}.controls`, '배열이어야 합니다.')
		for (const [controlIndex, controlValue] of group.controls.entries()) {
			validateControl(controlValue, `${groupPath}.controls[${controlIndex}]`)
			controlIds.add((controlValue as { id: string }).id)
		}
	}
	if (controller.left !== undefined)
		validateControlIdList(controller.left, controlIds, 'controller.left')
	if (controller.right !== undefined)
		validateControlIdList(controller.right, controlIds, 'controller.right')
	if (controller.remountOn !== undefined)
		validateControlIdList(controller.remountOn, controlIds, 'controller.remountOn')
	if (config.controllerPresentation !== undefined) {
		validateControllerPresentation(config.controllerPresentation, groupIds)
	}

	createControllerValues(controller.groups as readonly ControllerGroupDefinition[])
	return input as StudioControllerConfig
}

/** Payload의 sparse 그룹 표현값을 Runtime 그룹 순서의 완전한 Effective 정책으로 투영한다. */
export function resolveControllerPresentation(
	groups: readonly ControllerGroupDefinition[],
	input: unknown,
): StudioControllerPresentation {
	const overrides = new Map<string, { collapsible?: boolean; defaultOpen?: boolean }>()
	if (input != null) {
		const root = asRecord(input, 'controller presentation')
		assertOnlyKeys(root, ['groups'], 'controller presentation')
		if (root.groups != null) {
			if (!Array.isArray(root.groups))
				invalid('controller presentation.groups', '배열이어야 합니다.')
			const knownIds = new Set(groups.map(({ id }) => id))
			for (const [index, value] of root.groups.entries()) {
				const path = `controller presentation.groups[${index}]`
				const group = asRecord(value, path)
				assertOnlyKeys(group, ['groupId', 'collapsible', 'defaultOpen'], path)
				assertNonEmptyString(group.groupId, `${path}.groupId`)
				if (!knownIds.has(group.groupId))
					invalid(`${path}.groupId`, 'Runtime 그룹을 찾을 수 없습니다.')
				if (overrides.has(group.groupId)) invalid(`${path}.groupId`, '중복되었습니다.')
				if (group.collapsible !== undefined && typeof group.collapsible !== 'boolean') {
					invalid(`${path}.collapsible`, 'boolean이어야 합니다.')
				}
				if (group.defaultOpen !== undefined && typeof group.defaultOpen !== 'boolean') {
					invalid(`${path}.defaultOpen`, 'boolean이어야 합니다.')
				}
				if (group.collapsible === false && group.defaultOpen === false) {
					invalid(path, '접을 수 없는 그룹은 닫힌 상태로 시작할 수 없습니다.')
				}
				overrides.set(group.groupId, {
					...definedProperty('collapsible', group.collapsible as boolean | undefined),
					...definedProperty('defaultOpen', group.defaultOpen as boolean | undefined),
				})
			}
		}
	}

	return {
		groups: groups.map(({ id }) => {
			const override = overrides.get(id)
			const collapsible = override?.collapsible ?? true
			return {
				groupId: id,
				collapsible,
				defaultOpen: collapsible ? (override?.defaultOpen ?? true) : true,
			}
		}),
	}
}

/** Payload JSON을 kind-free Controller Restrictions 계약으로 읽는다. */
export function projectPayloadControllerRestrictions(
	input: unknown,
): StudioControllerRestrictions | null {
	if (!input || typeof input !== 'object') return null
	const record = asRecord(input, 'controller restrictions')
	assertOnlyKeys(record, ['controls'], 'controller restrictions')
	if (record.controls == null) return null
	if (!Array.isArray(record.controls))
		invalid('controller restrictions.controls', '배열이어야 합니다.')
	return { controls: record.controls.map(projectControllerRestriction) }
}

/** Admin Restrictions를 stable control id로 찾아 Base Definition보다 좁은 값만 적용한다. */
export function applyControllerRestrictions(
	baseGroups: readonly ControllerGroupDefinition[],
	restrictions: StudioControllerRestrictions | null,
): readonly ControllerGroupDefinition[] {
	if (!restrictions) return baseGroups
	const controlsById = new Map(
		baseGroups.flatMap((group) =>
			group.controls.map((control) => [control.id, control] as const),
		),
	)
	const restrictionsById = new Map<string, ControllerControlRestriction>()
	for (const control of restrictions.controls) {
		if (restrictionsById.has(control.controlId)) {
			throw new Error(
				`Controller restriction control id가 중복되었습니다: ${control.controlId}`,
			)
		}
		if (!controlsById.has(control.controlId)) {
			throw new Error(
				`Controller restriction control을 찾을 수 없습니다: ${control.controlId}`,
			)
		}
		restrictionsById.set(control.controlId, control)
	}

	return baseGroups.map((group) => ({
		...group,
		controls: group.controls.map((base) => {
			const control = restrictionsById.get(base.id)
			return control ? applyControlRestriction(base, control) : base
		}),
	}))
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

/** 편집 중에는 표시할 수 있도록 초과 text를 보존하되, 잠긴 값과 잘못된 kind는 거부한다. */
export function acceptsControllerDraftValue(
	control: ControllerControlDefinition,
	value: ControllerControlValue,
	binding?: ControllerRuntimeBinding,
): boolean {
	if (resolveControllerAvailability(control.availability, binding?.availability) !== 'enabled') {
		return false
	}
	return isControllerValueShape(control, value, false)
}

/** 실행 경계는 draft text를 포함한 값을 완전히 검증하고 잠긴 control에는 기본값만 허용한다. */
export function acceptsControllerExecutionValue(
	control: ControllerControlDefinition,
	value: ControllerControlValue,
): boolean {
	if (!isControllerValueShape(control, value, true)) return false
	return (
		(control.availability ?? 'enabled') === 'enabled' ||
		controllerValuesEqual(value, control.defaultValue)
	)
}

/** 실행 직전 전체 Definition 값이 빠짐없이 유효한지 한 번에 확인한다. */
export function acceptsControllerExecutionValues(
	groups: readonly ControllerGroupDefinition[],
	values: Readonly<ControllerValues>,
): boolean {
	return groups.every((group) =>
		group.controls.every(
			(control) =>
				Object.hasOwn(values, control.id) &&
				acceptsControllerExecutionValue(control, values[control.id]),
		),
	)
}

/** Published와 runtime availability를 더 제한적인 한 값으로 합친다. */
export function resolveControllerAvailability(
	published: ControllerAvailability = 'enabled',
	runtime: ControllerAvailability = 'enabled',
): ControllerAvailability {
	if (published === 'disabled' || runtime === 'disabled') return 'disabled'
	if (published === 'readonly' || runtime === 'readonly') return 'readonly'
	return 'enabled'
}

function isControllerValueShape(
	control: ControllerControlDefinition,
	value: ControllerControlValue,
	forExecution: boolean,
): boolean {
	switch (control.kind) {
		case 'text':
			return (
				(typeof value === 'string' || value === null) &&
				(!forExecution ||
					value === null ||
					control.maxLength === undefined ||
					value.length <= control.maxLength)
			)
		case 'toggle':
			return typeof value === 'boolean'
		case 'select':
			return (
				value === null ||
				(typeof value === 'string' &&
					control.options.some((option) => option.value === value))
			)
		case 'color':
			if (value === null) return true
			if (typeof value !== 'string' || !COLOR_PATTERN.test(value)) return false
			// 팔레트가 정해진 control은 목록 밖 색을 받지 않는다 — select가 options 밖 값을 막는 것과 같다.
			return !control.values || control.values.includes(value.toLowerCase())
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

function controllerValuesEqual(left: ControllerControlValue, right: ControllerControlValue) {
	if (isControllerPadValue(left) && isControllerPadValue(right)) {
		return left.x === right.x && left.y === right.y
	}
	return left === right
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
			assertOnlyKeys(
				control,
				[...CONTROL_BASE_KEYS, 'options', 'placeholder', 'variant'],
				path,
			)
			assertNullableString(control.defaultValue, `${path}.defaultValue`)
			if (!Array.isArray(control.options) || control.options.length === 0) {
				invalid(`${path}.options`, '하나 이상의 선택지가 필요합니다.')
			}
			const optionValues = new Set<string>()
			let colorOptionCount = 0
			let previewOptionCount = 0
			for (const [optionIndex, optionValue] of control.options.entries()) {
				const optionPath = `${path}.options[${optionIndex}]`
				const option = asRecord(optionValue, optionPath)
				assertOnlyKeys(option, ['colors', 'label', 'preview', 'value'], optionPath)
				assertNonEmptyString(option.value, `${optionPath}.value`)
				assertNonEmptyString(option.label, `${optionPath}.label`)
				// 색 조합 선택지 — 형식·중복 규칙은 color control의 팔레트와 같은 것을 쓴다.
				if (option.colors !== undefined) {
					assertColorValues(option.colors, `${optionPath}.colors`)
					colorOptionCount += 1
				}
				if (option.preview !== undefined) {
					assertPreviewLines(option.preview, `${optionPath}.preview`)
					previewOptionCount += 1
				}
				if (optionValues.has(option.value)) {
					invalid(`${optionPath}.value`, `중복되었습니다: ${option.value}`)
				}
				optionValues.add(option.value)
			}
			// 부분 선언은 막는다 — 일부만 색이면 칩 그리드도 목록도 되지 못하고 반쪽으로 그려진다.
			if (colorOptionCount > 0 && colorOptionCount < control.options.length) {
				invalid(`${path}.options`, 'colors는 모든 선택지에 있거나 없어야 합니다.')
			}
			if (previewOptionCount > 0 && previewOptionCount < control.options.length) {
				invalid(`${path}.options`, 'preview는 모든 선택지에 있거나 없어야 합니다.')
			}
			if (control.defaultValue !== null && !optionValues.has(control.defaultValue)) {
				invalid(`${path}.defaultValue`, 'options에 포함되어야 합니다.')
			}
			if (control.placeholder !== undefined && typeof control.placeholder !== 'string') {
				invalid(`${path}.placeholder`, '문자열이어야 합니다.')
			}
			if (
				control.variant !== undefined &&
				!SELECT_VARIANTS.includes(control.variant as SelectVariant)
			) {
				invalid(`${path}.variant`, '지원하지 않는 값입니다.')
			}
			return
		}
		case 'color': {
			assertOnlyKeys(control, [...CONTROL_BASE_KEYS, 'values'], path)
			assertNullableString(control.defaultValue, `${path}.defaultValue`)
			if (control.defaultValue !== null && !COLOR_PATTERN.test(control.defaultValue)) {
				invalid(`${path}.defaultValue`, '#rrggbb 형식이어야 합니다.')
			}
			if (control.values !== undefined) {
				const values = assertColorValues(control.values, `${path}.values`)
				if (
					control.defaultValue !== null &&
					!values.has(control.defaultValue.toLowerCase())
				) {
					invalid(`${path}.defaultValue`, 'values에 포함되어야 합니다.')
				}
			}
			return
		}
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

function validatePreviewImage(value: unknown) {
	const image = asRecord(value, 'previewImage')
	assertOnlyKeys(image, ['url', 'alt'], 'previewImage')
	assertNonEmptyString(image.url, 'previewImage.url')
	// alt는 빈 문자열을 허용한다 — 장식 이미지의 유효한 대체 텍스트이고, 이 값 때문에 Config 파싱이
	// 죽으면 스튜디오 전체가 열리지 않는다.
	if (typeof image.alt !== 'string') invalid('previewImage.alt', '문자열이어야 합니다.')
}

/**
 * Payload upload 문서를 표시 계약으로 좁힌다 — 미리보기가 없거나 파일이 아직 없으면 undefined다.
 * 카드가 쓰는 크기는 320×240 thumbnail이므로 있으면 그것을 쓰고, 없으면 원본으로 떨어진다.
 */
export function toStudioPreviewImage(value: unknown): StudioPreviewImage | undefined {
	if (!value || typeof value !== 'object') return undefined
	const document = value as {
		url?: unknown
		alt?: unknown
		sizes?: { thumbnail?: { url?: unknown } }
	}
	const url = document.sizes?.thumbnail?.url ?? document.url
	if (typeof url !== 'string' || url.length === 0) return undefined
	return { url, alt: typeof document.alt === 'string' ? document.alt : '' }
}

function validateControllerPresentation(value: unknown, groupIds: ReadonlySet<string>) {
	const presentation = asRecord(value, 'controllerPresentation')
	assertOnlyKeys(presentation, ['groups'], 'controllerPresentation')
	if (!Array.isArray(presentation.groups)) {
		invalid('controllerPresentation.groups', '배열이어야 합니다.')
	}
	const seen = new Set<string>()
	for (const [index, value] of presentation.groups.entries()) {
		const path = `controllerPresentation.groups[${index}]`
		const group = asRecord(value, path)
		assertOnlyKeys(group, ['groupId', 'collapsible', 'defaultOpen'], path)
		assertNonEmptyString(group.groupId, `${path}.groupId`)
		if (!groupIds.has(group.groupId))
			invalid(`${path}.groupId`, 'Controller 그룹을 찾을 수 없습니다.')
		if (seen.has(group.groupId)) invalid(`${path}.groupId`, '중복되었습니다.')
		seen.add(group.groupId)
		if (typeof group.collapsible !== 'boolean')
			invalid(`${path}.collapsible`, 'boolean이어야 합니다.')
		if (typeof group.defaultOpen !== 'boolean')
			invalid(`${path}.defaultOpen`, 'boolean이어야 합니다.')
		if (!group.collapsible && !group.defaultOpen) {
			invalid(path, '접을 수 없는 그룹은 닫힌 상태로 시작할 수 없습니다.')
		}
	}
	if (seen.size !== groupIds.size) {
		invalid('controllerPresentation.groups', '모든 Controller 그룹의 표현 정책이 필요합니다.')
	}
}

function projectControllerRestriction(value: unknown): ControllerControlRestriction {
	const control = asRecord(value, 'controller restriction control')
	assertOnlyKeys(
		control,
		[
			'controlId',
			'availability',
			'defaultValue',
			'maxLength',
			'optionValues',
			'colorValues',
			'min',
			'max',
		],
		'controller restriction control',
	)
	assertNonEmptyString(control.controlId, 'controller restriction control.controlId')
	const availability = normalizeRestrictionAvailability(control.availability)
	if (control.availability !== undefined && availability === undefined) {
		invalid('controller restriction control.availability', 'readonly 또는 disabled여야 합니다.')
	}
	if (
		control.maxLength !== undefined &&
		(typeof control.maxLength !== 'number' ||
			!Number.isInteger(control.maxLength) ||
			control.maxLength <= 0)
	) {
		invalid('controller restriction control.maxLength', '0보다 큰 정수여야 합니다.')
	}
	if (control.optionValues !== undefined) {
		if (!Array.isArray(control.optionValues) || control.optionValues.length === 0) {
			invalid('controller restriction control.optionValues', '하나 이상의 값이 필요합니다.')
		}
		const values = new Set<string>()
		for (const [index, option] of control.optionValues.entries()) {
			assertNonEmptyString(option, `controller restriction control.optionValues[${index}]`)
			if (values.has(option)) {
				invalid(`controller restriction control.optionValues[${index}]`, '중복되었습니다.')
			}
			values.add(option)
		}
	}
	if (control.colorValues !== undefined) {
		assertColorValues(control.colorValues, 'controller restriction control.colorValues')
	}
	if (control.min !== undefined) assertNumber(control.min, 'controller restriction control.min')
	if (control.max !== undefined) assertNumber(control.max, 'controller restriction control.max')
	if (control.defaultValue !== undefined) {
		assertJsonValue(control.defaultValue, 'controller restriction control.defaultValue')
	}
	return {
		controlId: control.controlId,
		...definedProperty('availability', availability),
		...definedProperty(
			'defaultValue',
			control.defaultValue as ControllerControlValue | undefined,
		),
		...definedProperty('maxLength', control.maxLength as number | undefined),
		...definedProperty('optionValues', control.optionValues as string[] | undefined),
		...definedProperty('colorValues', control.colorValues as string[] | undefined),
		...definedProperty('min', control.min as number | undefined),
		...definedProperty('max', control.max as number | undefined),
	}
}

function normalizeRestrictionAvailability(
	value: ControllerAvailability | null | unknown,
): Exclude<ControllerAvailability, 'enabled'> | undefined {
	return value === 'readonly' || value === 'disabled' ? value : undefined
}

function applyControlRestriction(
	base: ControllerControlDefinition,
	restriction: ControllerControlRestriction,
): ControllerControlDefinition {
	const availability = restriction.availability ?? base.availability
	const rank: Record<ControllerAvailability, number> = { enabled: 0, readonly: 1, disabled: 2 }
	if (rank[availability ?? 'enabled'] < rank[base.availability ?? 'enabled']) {
		throw new Error(`Controller restriction availability가 기본 계약을 확장합니다: ${base.id}`)
	}
	let next: ControllerControlDefinition
	switch (base.kind) {
		case 'text':
			if (
				restriction.optionValues ||
				restriction.colorValues ||
				restriction.min !== undefined ||
				restriction.max !== undefined
			) {
				throw new Error(`text control에 지원하지 않는 restriction입니다: ${base.id}`)
			}
			if (
				base.maxLength !== undefined &&
				restriction.maxLength !== undefined &&
				restriction.maxLength > base.maxLength
			) {
				throw new Error(
					`Controller restriction maxLength가 기본 계약을 확장합니다: ${base.id}`,
				)
			}
			next = {
				...base,
				...definedProperty('availability', availability),
				...definedProperty(
					'defaultValue',
					restriction.defaultValue as string | null | undefined,
				),
				...definedProperty('maxLength', restriction.maxLength),
			}
			break
		case 'select': {
			if (
				restriction.maxLength ||
				restriction.colorValues ||
				restriction.min !== undefined ||
				restriction.max !== undefined
			) {
				throw new Error(`select control에 지원하지 않는 restriction입니다: ${base.id}`)
			}
			const allowed = restriction.optionValues ? new Set(restriction.optionValues) : null
			if (
				allowed &&
				[...allowed].some((value) => !base.options.some((o) => o.value === value))
			) {
				throw new Error(
					`Controller restriction options가 기본 계약을 확장합니다: ${base.id}`,
				)
			}
			next = {
				...base,
				...definedProperty('availability', availability),
				...definedProperty(
					'defaultValue',
					restriction.defaultValue as string | null | undefined,
				),
				options: allowed
					? base.options.filter((option) => allowed.has(option.value))
					: base.options,
			}
			break
		}
		case 'range': {
			if (restriction.maxLength || restriction.optionValues || restriction.colorValues) {
				throw new Error(`range control에 지원하지 않는 restriction입니다: ${base.id}`)
			}
			const min = restriction.min ?? base.min
			const max = restriction.max ?? base.max
			if (min < base.min || max > base.max) {
				throw new Error(`Controller restriction range가 기본 계약을 확장합니다: ${base.id}`)
			}
			next = {
				...base,
				...definedProperty('availability', availability),
				...definedProperty('defaultValue', restriction.defaultValue as number | undefined),
				min,
				max,
			}
			break
		}
		case 'toggle':
			if (
				restriction.maxLength ||
				restriction.optionValues ||
				restriction.colorValues ||
				restriction.min !== undefined ||
				restriction.max !== undefined
			) {
				throw new Error(
					`${base.kind} control에 지원하지 않는 restriction입니다: ${base.id}`,
				)
			}
			next = {
				...base,
				...definedProperty('availability', availability),
				...definedProperty('defaultValue', restriction.defaultValue as boolean | undefined),
			}
			break
		case 'color': {
			if (
				restriction.maxLength ||
				restriction.optionValues ||
				restriction.min !== undefined ||
				restriction.max !== undefined
			) {
				throw new Error(
					`${base.kind} control에 지원하지 않는 restriction입니다: ${base.id}`,
				)
			}
			const allowed = restriction.colorValues?.map((value) => value.toLowerCase())
			const baseValues = base.values
			if (allowed && baseValues && allowed.some((value) => !baseValues.includes(value))) {
				throw new Error(
					`Controller restriction colorValues가 기본 계약을 확장합니다: ${base.id}`,
				)
			}
			next = {
				...base,
				...definedProperty('availability', availability),
				...definedProperty(
					'defaultValue',
					restriction.defaultValue as string | null | undefined,
				),
				...definedProperty('values', allowed ?? baseValues),
			}
			break
		}
		case 'pad':
			if (
				restriction.maxLength ||
				restriction.optionValues ||
				restriction.colorValues ||
				restriction.min !== undefined ||
				restriction.max !== undefined
			) {
				throw new Error(
					`${base.kind} control에 지원하지 않는 restriction입니다: ${base.id}`,
				)
			}
			next = {
				...base,
				...definedProperty('availability', availability),
				...definedProperty(
					'defaultValue',
					restriction.defaultValue as ControllerPadValue | undefined,
				),
			}
			break
	}
	validateControl(next, `controller restriction ${base.id}`)
	return next
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

/**
 * 기본 컨트롤 선언을 검증한다.
 *
 * 🔴 **없는 id를 통과시키면 안 된다.** 오타 하나가 「그 컨트롤이 조용히 고급으로 밀린 것」과
 *    구분되지 않고, 화면에서는 컨트롤 하나가 이유 없이 사라진 것으로만 보인다.
 */
/** 존재하는 control id만 담은 중복 없는 배열인가 — `left`·`right`·`remountOn`이 같은 규칙을 쓴다. */
function validateControlIdList(value: unknown, controlIds: ReadonlySet<string>, field: string) {
	if (!Array.isArray(value)) invalid(field, '배열이어야 합니다.')
	const seen = new Set<string>()
	for (const [index, id] of value.entries()) {
		const path = `${field}[${index}]`
		assertNonEmptyString(id, path)
		if (seen.has(id)) invalid(path, `중복되었습니다: ${id}`)
		seen.add(id)
		if (!controlIds.has(id)) invalid(path, `존재하지 않는 control id입니다: ${id}`)
	}
}

/** 단위 정사각형(0~1) 안의 선분 목록인가 — 밖으로 나가면 썸네일이 잘려 무엇인지 안 읽힌다. */
function assertPreviewLines(value: unknown, path: string) {
	if (!Array.isArray(value) || value.length === 0) invalid(path, '하나 이상의 선분이 필요합니다.')
	for (const [index, line] of value.entries()) {
		const linePath = `${path}[${index}]`
		if (!Array.isArray(line) || line.length !== 4)
			invalid(linePath, '[x1, y1, x2, y2] 네 값이어야 합니다.')
		for (const coordinate of line) {
			if (typeof coordinate !== 'number' || !Number.isFinite(coordinate))
				invalid(linePath, '좌표는 유한한 숫자여야 합니다.')
			if (coordinate < 0 || coordinate > 1) invalid(linePath, '좌표는 0~1이어야 합니다.')
		}
	}
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

/** 허용 색 목록을 검증하고 비교용 소문자 집합으로 돌려준다 — hex 대소문자는 같은 색이다. */
function assertColorValues(value: unknown, path: string): ReadonlySet<string> {
	if (!Array.isArray(value) || value.length === 0) {
		invalid(path, '하나 이상의 색이 필요합니다.')
	}
	const values = new Set<string>()
	for (const [index, item] of value.entries()) {
		assertNonEmptyString(item, `${path}[${index}]`)
		if (!COLOR_PATTERN.test(item)) invalid(`${path}[${index}]`, '#rrggbb 형식이어야 합니다.')
		const normalized = item.toLowerCase()
		if (values.has(normalized)) invalid(`${path}[${index}]`, '중복되었습니다.')
		values.add(normalized)
	}
	return values
}

function assertNumber(value: unknown, path: string): asserts value is number {
	if (typeof value !== 'number' || !Number.isFinite(value))
		invalid(path, '유한한 숫자여야 합니다.')
}

function invalid(path: string, message: string): never {
	throw new Error(`StudioControllerConfig ${path}: ${message}`)
}

function definedProperty<Key extends string, Value>(key: Key, value: Value | undefined) {
	return value === undefined ? {} : ({ [key]: value } as Record<Key, Value>)
}
