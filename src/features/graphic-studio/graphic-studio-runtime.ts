import {
	FORWARD_STRAIGHT_DEFAULT_INPUT,
	toControllerPadValue,
	toForwardStraightInput,
} from '@/features/generate-graphic/forward-straight'
import {
	createForwardStraightScene,
	createForwardStraightSvg,
} from '@/features/generate-graphic/forward-straight-geometry'
import { RADIAL_FLUTED_GLASS_DEFAULT_INPUT } from '@/features/generate-graphic/radial-fluted-glass'
import {
	type GraphicStudioConfig,
	type PublishedGraphicProfileDefinition,
	parseGraphicStudioConfig,
} from '@/features/graphic-studio/graphic-studio-config'
import type {
	ControllerRuntimeBindings,
	ControllerValues,
} from '@/features/studio-controller/controller-definition'
import {
	narrowControllerGroups,
	projectPayloadController,
} from '@/features/studio-controller/controller-definition'

type GraphicViewport = { width: number; height: number }

type GraphicStudioRuntime = {
	config: GraphicStudioConfig
	renderSvg?: (values: ControllerValues, viewport: GraphicViewport) => string
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
	'radial-fluted-glass': {
		config: {
			studio: 'graphic',
			id: 'radial-fluted-glass',
			version: 1,
			name: 'Radial Fluted Glass',
			type: 'shader',
			controller: {
				groups: [
					{
						id: 'rays',
						title: 'Rays',
						controls: [
							{
								id: 'bloomColor',
								kind: 'color',
								label: '블룸 색상',
								defaultValue: RADIAL_FLUTED_GLASS_DEFAULT_INPUT.bloomColor,
							},
							{
								id: 'rayIntensity',
								kind: 'range',
								label: '광선 강도',
								defaultValue: RADIAL_FLUTED_GLASS_DEFAULT_INPUT.rayIntensity,
								min: 0,
								max: 1,
								step: 0.01,
								display: { precision: 2 },
							},
							{
								id: 'rayDensity',
								kind: 'range',
								label: '광선 밀도',
								defaultValue: RADIAL_FLUTED_GLASS_DEFAULT_INPUT.rayDensity,
								min: 0,
								max: 1,
								step: 0.01,
								display: { precision: 2 },
							},
							{
								id: 'speed',
								kind: 'range',
								label: '속도',
								defaultValue: RADIAL_FLUTED_GLASS_DEFAULT_INPUT.speed,
								min: 0,
								max: 2,
								step: 0.01,
								display: { precision: 2 },
							},
						],
					},
					{
						id: 'glass',
						title: 'Glass',
						controls: [
							{
								id: 'glassSize',
								kind: 'range',
								label: '플루트 크기',
								defaultValue: RADIAL_FLUTED_GLASS_DEFAULT_INPUT.glassSize,
								min: 0,
								max: 1,
								step: 0.01,
								display: { precision: 2 },
							},
							{
								id: 'glassDistortion',
								kind: 'range',
								label: '유리 왜곡',
								defaultValue: RADIAL_FLUTED_GLASS_DEFAULT_INPUT.glassDistortion,
								min: 0,
								max: 1,
								step: 0.01,
								display: { precision: 2 },
							},
						],
					},
					{
						id: 'position',
						title: 'Position',
						controls: [
							{
								id: 'source',
								kind: 'pad',
								label: '광원',
								defaultValue: RADIAL_FLUTED_GLASS_DEFAULT_INPUT.source,
							},
						],
					},
				],
			},
		},
		getBindings: (viewport): ControllerRuntimeBindings =>
			viewport.width > 0 && viewport.height > 0
				? { source: { padAspectRatio: viewport.width / viewport.height } }
				: {},
	},
} satisfies Record<string, GraphicStudioRuntime>

export const forwardStraightGraphicConfig = graphicStudioRuntimeRegistry['forward-straight'].config
export const radialFlutedGlassGraphicConfig =
	graphicStudioRuntimeRegistry['radial-fluted-glass'].config

export const graphicStudioConfigs: readonly GraphicStudioConfig[] = Object.values(
	graphicStudioRuntimeRegistry,
).map((runtime) => runtime.config)

export const GRAPHIC_RUNTIME_OPTIONS = Object.entries(graphicStudioRuntimeRegistry).map(
	([value, runtime]) => ({ value, label: runtime.config.name }),
)

/** published Graphic Profile을 등록된 runtime의 기본 계약보다 좁은 Config로 투영한다. */
export function deriveGraphicStudioConfig(
	profile: PublishedGraphicProfileDefinition,
): GraphicStudioConfig {
	const runtime =
		graphicStudioRuntimeRegistry[profile.runtime as keyof typeof graphicStudioRuntimeRegistry]
	if (!runtime) throw new Error(`등록되지 않은 Graphic runtime입니다: ${profile.runtime}`)
	const storedController = projectPayloadController(profile.controller)
	const config: GraphicStudioConfig = {
		...runtime.config,
		name: profile.name,
		controller: {
			groups: storedController
				? narrowControllerGroups(runtime.config.controller.groups, storedController.groups)
				: runtime.config.controller.groups,
		},
	}
	parseGraphicStudioConfig(config)
	return config
}

/** 등록된 Graphic runtime만 순수 SVG로 투영한다. */
export function renderGraphicStudioSvg(
	config: GraphicStudioConfig,
	values: ControllerValues,
	viewport: GraphicViewport,
): string | null {
	const runtime = getGraphicStudioRuntime(config)
	return runtime?.renderSvg?.(values, viewport) ?? null
}

/** SVG adapter가 준비된 Graphic Config만 Template 합성 경로에 허용한다. */
export function canRenderGraphicStudioSvg(config: GraphicStudioConfig): boolean {
	return Boolean(getGraphicStudioRuntime(config)?.renderSvg)
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
