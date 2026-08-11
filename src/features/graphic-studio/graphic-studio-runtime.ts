import {
	FORWARD_STRAIGHT_DEFAULT_INPUT,
	toControllerPadValue,
	toForwardStraightInput,
} from '@/features/generate-graphic/forward-straight'
import {
	createForwardStraightScene,
	createForwardStraightSvg,
} from '@/features/generate-graphic/forward-straight-geometry'
import type { GraphicStudioConfig } from '@/features/graphic-studio/graphic-studio-config'
import type {
	ControllerRuntimeBindings,
	ControllerValues,
} from '@/features/studio-controller/controller-definition'

type GraphicViewport = { width: number; height: number }

type GraphicStudioRuntime = {
	config: GraphicStudioConfig
	renderSvg: (values: ControllerValues, viewport: GraphicViewport) => string
	getBindings: (viewport: GraphicViewport) => ControllerRuntimeBindings
}

const graphicStudioRuntimeRegistry = {
	'forward-straight': {
		config: {
			studio: 'graphic',
			id: 'forward-straight',
			version: 1,
			name: 'Forward Straight',
			type: 'p5',
			controller: {
				groups: [
					{
						id: 'graphic',
						title: 'Graphic',
						collapsible: true,
						controls: [
							{
								id: 'variableWeightEnabled',
								kind: 'toggle',
								label: '가변 두께',
								defaultValue: FORWARD_STRAIGHT_DEFAULT_INPUT.variableWeightEnabled,
							},
							{
								id: 'viewpoint',
								kind: 'select',
								label: '시점',
								defaultValue: FORWARD_STRAIGHT_DEFAULT_INPUT.viewpoint,
								options: [
									{ value: 'flat', label: '평면' },
									{ value: 'low-angle', label: '로우앵글' },
								],
							},
							{
								id: 'angleIntensity',
								kind: 'select',
								label: '각도',
								defaultValue: FORWARD_STRAIGHT_DEFAULT_INPUT.angleIntensity,
								options: [
									{ value: 'weak', label: '약함' },
									{ value: 'medium', label: '보통' },
									{ value: 'strong', label: '강함' },
								],
							},
						],
					},
					{
						id: 'position',
						title: 'Position',
						controls: [
							{
								id: 'origin',
								kind: 'pad',
								label: '기준점',
								defaultValue: toControllerPadValue(
									FORWARD_STRAIGHT_DEFAULT_INPUT.origin,
								),
							},
						],
					},
				],
			},
		},
		renderSvg: (values, viewport) =>
			createForwardStraightSvg(
				createForwardStraightScene(toForwardStraightInput(values), viewport),
			),
		getBindings: (viewport): ControllerRuntimeBindings =>
			viewport.width > 0 && viewport.height > 0
				? { origin: { padAspectRatio: viewport.width / viewport.height } }
				: {},
	},
} satisfies Record<string, GraphicStudioRuntime>

export const forwardStraightGraphicConfig = graphicStudioRuntimeRegistry['forward-straight'].config

export const graphicStudioConfigs: readonly GraphicStudioConfig[] = Object.values(
	graphicStudioRuntimeRegistry,
).map((runtime) => runtime.config)

/** 등록된 Graphic runtime만 순수 SVG로 투영한다. */
export function renderGraphicStudioSvg(
	config: GraphicStudioConfig,
	values: ControllerValues,
	viewport: GraphicViewport,
): string | null {
	const runtime = getGraphicStudioRuntime(config)
	return runtime?.renderSvg(values, viewport) ?? null
}

/** Graphic runtime이 의미를 아는 control에만 대상 기하 binding을 제공한다. */
export function getGraphicStudioRuntimeBindings(
	config: GraphicStudioConfig,
	viewport: GraphicViewport,
): ControllerRuntimeBindings {
	return getGraphicStudioRuntime(config)?.getBindings(viewport) ?? {}
}

function getGraphicStudioRuntime(config: GraphicStudioConfig): GraphicStudioRuntime | null {
	if (config.studio !== 'graphic') return null
	const runtime =
		graphicStudioRuntimeRegistry[config.id as keyof typeof graphicStudioRuntimeRegistry]
	return runtime?.config.type === config.type ? runtime : null
}
