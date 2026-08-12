import {
	parseStudioControllerConfig,
	type StudioControllerConfig,
} from '@/features/studio-controller/controller-definition'

export type GraphicOutputFormat = 'svg'

/** P5·Shader 그래픽 하나가 스튜디오에 내는 직렬화 가능한 편집 계약. */
export type GraphicStudioConfig = StudioControllerConfig<'graphic', string, GraphicOutputFormat> & {
	type: 'p5' | 'shader'
}

/** Payload Graphic Profile이 runtime Config를 좁히기 위해 공개하는 서버측 정의. */
export type PublishedGraphicProfileDefinition = {
	id: number
	name: string
	runtime: string
	controller?: unknown
	controllerOverride?: unknown
	output?: { allowedFormats?: readonly string[] | null } | null
}

/** unknown 입력을 공통 Controller 계약과 Graphic runtime descriptor로 검증한다. */
export function parseGraphicStudioConfig(input: unknown): GraphicStudioConfig {
	const config = parseStudioControllerConfig(input)
	const value = asRecord(input)
	assertOnlyKeys(value, ['studio', 'id', 'version', 'name', 'output', 'controller', 'type'])
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
	const output = asRecord(value.output)
	assertOnlyKeys(output, ['formats'])
	if ((config.output.formats as readonly string[]).some((format) => format !== 'svg')) {
		throw new Error('GraphicStudioConfig output format은 svg만 지원합니다.')
	}
	return input as GraphicStudioConfig
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
