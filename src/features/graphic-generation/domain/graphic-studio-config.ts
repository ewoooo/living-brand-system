import {
	parseStudioOutputCapability,
	resolveStudioArtifactOutputFormats,
	type StudioOutputCapability,
} from '@/features/studio-export/studio-output'
import {
	parseStudioControllerConfig,
	type StudioControllerConfig,
} from '@/modules/studio-controller/controller-definition'

/** Admin 제한 전 P5·Shader runtime이 발행하는 서버 안전 원본 계약. */
export type GraphicRuntimeManifest = StudioControllerConfig<'graphic', string> & {
	type: 'p5' | 'shader'
}

/** Published Graphic Profile 정책이 적용된 Effective Config. */
export type GraphicStudioConfig = GraphicRuntimeManifest & {
	output: StudioOutputCapability
}

/** Payload Graphic Profile이 runtime Config를 좁히기 위해 공개하는 서버측 정의. */
export type PublishedGraphicProfileDefinition = {
	id: number
	name: string
	runtime: string
	controllerRestrictions?: unknown
	exportPolicy?: unknown
	controllerPresentation?: unknown
	previewImage?: unknown
}

/** unknown 입력을 공통 Controller 계약과 Graphic runtime descriptor로 검증한다. */
export function parseGraphicRuntimeManifest(input: unknown): GraphicRuntimeManifest {
	const config = parseStudioControllerConfig(input)
	const value = asRecord(input)
	assertOnlyKeys(value, [
		'studio',
		'id',
		'version',
		'name',
		'artifacts',
		'controller',
		'controllerPresentation',
		'type',
	])
	if (config.studio !== 'graphic') {
		throw new Error('GraphicStudioConfig studio: graphic이어야 합니다.')
	}
	if (typeof config.id !== 'string') {
		throw new Error('GraphicStudioConfig id: 문자열이어야 합니다.')
	}
	const type = (input as { type?: unknown }).type
	if (type !== 'p5' && type !== 'shader') {
		throw new Error('GraphicStudioConfig type: p5 또는 shader여야 합니다.')
	}
	return input as GraphicRuntimeManifest
}

/** unknown 입력을 Graphic Runtime Manifest와 Effective output까지 검증한다. */
export function parseGraphicStudioConfig(input: unknown): GraphicStudioConfig {
	const config = parseStudioControllerConfig(input)
	const value = asRecord(input)
	assertOnlyKeys(value, [
		'studio',
		'id',
		'version',
		'name',
		'artifacts',
		'output',
		'controller',
		'controllerPresentation',
		'previewImage',
		'type',
	])
	assertGraphicIdentity(config, input)
	const output = parseStudioOutputCapability(value.output)
	resolveStudioArtifactOutputFormats(config.artifacts, output.formats)
	if (output.formats.includes('mp4') && !output.video?.mp4) {
		throw new Error('GraphicStudioConfig MP4 capability가 필요합니다.')
	}
	return input as GraphicStudioConfig
}

function assertGraphicIdentity(
	config: StudioControllerConfig,
	input: unknown,
): asserts config is StudioControllerConfig<'graphic', string> {
	if (config.studio !== 'graphic') {
		throw new Error('GraphicStudioConfig studio: graphic이어야 합니다.')
	}
	if (typeof config.id !== 'string') {
		throw new Error('GraphicStudioConfig id: 문자열이어야 합니다.')
	}
	const type = (input as { type?: unknown }).type
	if (type !== 'p5' && type !== 'shader') {
		throw new Error('GraphicStudioConfig type: p5 또는 shader여야 합니다.')
	}
}

function asRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error('GraphicStudioConfig가 객체가 아닙니다.')
	}
	return value as Record<string, unknown>
}

function assertOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]) {
	const allowedKeys = new Set(allowed)
	for (const key of Object.keys(value)) {
		if (!allowedKeys.has(key)) {
			throw new Error(`GraphicStudioConfig에 알 수 없는 필드가 있습니다: ${key}`)
		}
	}
}

/**
 * 같은 Graphic 파이프라인을 쓰지만 창작자에게는 **다른 메뉴**로 서는 갈래.
 *
 * 🔑 컬렉션을 쪼개지 않은 이유: 계약(Manifest→Restriction→Config→Export)이 완전히 같고 다른 것은
 *    "어느 메뉴에 서는가"뿐이다. 컬렉션·repository·서비스를 복제하면 같은 규칙을 두 번 구현하게 된다.
 * 🔴 여기 없는 runtime은 전부 Graphic에 선다 — 새 runtime을 Graph에 세우려면 이 목록에 넣는다.
 */
export const GRAPH_RUNTIME_IDS: readonly string[] = ['infographic']

export type StudioGraphicKind = 'graphic' | 'graph'

export function isGraphicKind(kind: unknown): kind is StudioGraphicKind {
	return kind === 'graphic' || kind === 'graph'
}

/** runtime id로 두 메뉴의 목록을 가른다. 한 runtime은 한 메뉴에만 선다. */
export function filterConfigsByStudioKind<Config extends { id: string }>(
	configs: readonly Config[],
	kind: StudioGraphicKind,
): Config[] {
	return configs.filter((config) => GRAPH_RUNTIME_IDS.includes(config.id) === (kind === 'graph'))
}
