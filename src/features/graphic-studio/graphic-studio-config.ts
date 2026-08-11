import {
	parseStudioControllerConfig,
	type StudioControllerConfig,
} from '@/features/studio-controller/controller-definition'

/** P5·Shader 그래픽 하나가 스튜디오에 내는 직렬화 가능한 편집 계약. */
export type GraphicStudioConfig = StudioControllerConfig<'graphic', string> & {
	type: 'p5' | 'shader'
}

/** unknown 입력을 공통 Controller 계약과 Graphic runtime descriptor로 검증한다. */
export function parseGraphicStudioConfig(input: unknown): GraphicStudioConfig {
	const config = parseStudioControllerConfig(input)
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
	return input as GraphicStudioConfig
}
