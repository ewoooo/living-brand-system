import { toJSONSchema, type z } from 'zod'
import type {
	ControllerControlDefinition,
	ControllerPadValue,
} from '@/modules/studio-controller/controller-definition'

/**
 * 런타임의 입력 zod 스키마에서 **전체 파라미터**의 컨트롤 정의를 파생한다.
 *
 * 🔑 왜 파생하나 — 셰이더 런타임은 파라미터가 40개를 넘는데, 스튜디오의 `definition.ts`는 그중
 *    **창작자에게 노출할 소수**만 손으로 선언한다. 나머지는 프리셋이 덮는 값이라 컨트롤 정의가 없다.
 *    브랜드 디자이너가 프리셋을 만들려면 그 전부를 만져야 하므로, 목록을 두 번 적는 대신
 *    이름·타입·범위를 이미 다 갖고 있는 스키마에서 뽑는다.
 * 🔴 손으로 두 벌을 유지하면 반드시 어긋난다 — 그때 새 파라미터는 화면에 없거나 조용히 무시된다.
 *
 * 🔑 zod 내부(`_zod.def`)를 파지 않고 공개 API인 `z.toJSONSchema()`가 낸 JSON Schema를 읽는다.
 *    내부 구조는 마이너 버전에서 바뀌지만 JSON Schema는 계약이다.
 */

/** `z.toJSONSchema()`가 내놓는 값 중 이 변환기가 읽는 부분만. */
type JsonSchemaNode = {
	type?: string
	enum?: readonly unknown[]
	pattern?: string
	minimum?: number
	maximum?: number
	properties?: Record<string, JsonSchemaNode>
}

/** 색을 문자열과 가르는 표식. `hexColorSchema`가 내는 pattern이다. */
const HEX_COLOR_PATTERN = /#\[0-9a-f\]\{6\}/i

/**
 * 슬라이더 눈금. 범위가 좁을수록 잘게 썰어야 손으로 맞출 수 있다 —
 * 0~1 축을 step 1로 주면 값이 0과 1 둘뿐이 된다.
 */
export function resolveRangeStep(min: number, max: number): number {
	const span = Math.abs(max - min)
	if (span <= 2) return 0.01
	if (span <= 20) return 0.1
	return 1
}

/** 사람이 읽는 이름이 없으면 식별자를 띄어쓰기로 편다(`glassEdgeSoftness` → `glass edge softness`). */
function humanize(key: string): string {
	return key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
}

function isPadNode(node: JsonSchemaNode): boolean {
	const properties = node.properties
	return (
		node.type === 'object' &&
		properties !== undefined &&
		Object.keys(properties).length === 2 &&
		properties.x?.type === 'number' &&
		properties.y?.type === 'number'
	)
}

/**
 * 한 필드를 컨트롤 하나로 옮긴다. 옮길 수 없는 모양이면 `null`이다 —
 * 🔴 모르는 타입을 text로 떨어뜨리지 않는다. 자유 문자열이 셰이더 uniform에 들어가면 화면이 깨진다.
 */
function toControl(
	key: string,
	node: JsonSchemaNode,
	defaultValue: unknown,
	label: string,
): ControllerControlDefinition | null {
	if (node.enum?.every((value) => typeof value === 'string')) {
		return {
			id: key,
			label,
			kind: 'select',
			defaultValue: typeof defaultValue === 'string' ? defaultValue : null,
			options: (node.enum as readonly string[]).map((value) => ({ value, label: value })),
		}
	}
	if (node.type === 'string' && node.pattern && HEX_COLOR_PATTERN.test(node.pattern)) {
		return {
			id: key,
			label,
			kind: 'color',
			defaultValue: typeof defaultValue === 'string' ? defaultValue : null,
		}
	}
	if (node.type === 'boolean') {
		return { id: key, label, kind: 'toggle', defaultValue: defaultValue === true }
	}
	if (node.type === 'number' && node.minimum !== undefined && node.maximum !== undefined) {
		return {
			id: key,
			label,
			kind: 'range',
			defaultValue: typeof defaultValue === 'number' ? defaultValue : node.minimum,
			min: node.minimum,
			max: node.maximum,
			step: resolveRangeStep(node.minimum, node.maximum),
		}
	}
	if (isPadNode(node)) {
		const pad = defaultValue as Partial<ControllerPadValue> | undefined
		return {
			id: key,
			label,
			kind: 'pad',
			defaultValue: { x: pad?.x ?? 0, y: pad?.y ?? 0 },
		}
	}
	return null
}

export type SchemaControlsResult = {
	controls: readonly ControllerControlDefinition[]
	/** 컨트롤로 옮기지 못한 필드. 🔴 조용히 버리지 않는다 — 저작 화면에 없으면 프리셋에도 못 담긴다. */
	skipped: readonly string[]
}

/**
 * 입력 스키마와 기본값에서 전체 파라미터 컨트롤을 만든다.
 *
 * @param labels 사람이 읽는 이름. 없는 키는 식별자를 편 이름으로 떨어진다.
 */
export function schemaToControls(
	schema: z.ZodType,
	defaults: Record<string, unknown>,
	labels: Readonly<Record<string, string>> = {},
): SchemaControlsResult {
	const root = toJSONSchema(schema) as JsonSchemaNode
	const properties = root.properties
	if (!properties) return { controls: [], skipped: [] }

	const controls: ControllerControlDefinition[] = []
	const skipped: string[] = []
	for (const [key, node] of Object.entries(properties)) {
		const control = toControl(key, node, defaults[key], labels[key] ?? humanize(key))
		if (control) controls.push(control)
		else skipped.push(key)
	}
	return { controls, skipped }
}
