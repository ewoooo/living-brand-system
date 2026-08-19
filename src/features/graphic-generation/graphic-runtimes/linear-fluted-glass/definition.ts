import { defineGraphicRuntime } from '@/features/graphic-generation/graphic-runtimes/define-graphic-runtime'
import type { ControllerControlDefinition } from '@/modules/studio-controller/controller-definition'

export const LINEAR_FLUTED_GLASS_DEFAULT_INPUT = {
	source: { x: -0.62, y: 0.04 },
	sourceOffsetX: 0,
	sourceOffsetY: 0,
	bloomColor: '#2ad97a',
	rayColor1: '#001a0b',
	rayColor2: '#06381b',
	rayColor3: '#0f6b32',
	rayColor4: '#8ee34a',
	rayColor5: '#e6fff4',
	rayBackgroundColor: '#000d06',
	rayBloom: 0.24,
	rayIntensity: 0.62,
	rayDensity: 0.22,
	raySpotty: 0.86,
	rayMidSize: 0.18,
	rayMidIntensity: 0.32,
	speed: 0.62,
	frameOffsetMs: 0,
	rayScale: 1,
	rayRotation: 0,
	axisFalloff: 1.7,
	flowSpeed: 0.06,
	paletteShift: 1.2,
	paletteDrift: 0.08,
	pulseIntensity: 0.3,
	pulseSpeed: 0.28,
	pulseDensity: 0.9,
	pulseWidth: 0.22,
	glassSize: 0.92,
	ribCurve: 0.5,
	glassAngle: 0,
	glassOriginOffset: { x: 0, y: 0 },
	glassOffset: 0,
	glassSpeed: -0.02,
	glassDrift: { x: 0, y: 0.03 },
	glassDriftSpeedX: 0.19,
	glassDriftSpeedY: 0.27,
	glassDistortion: 0.62,
	glassEdgeSoftness: 0.55,
	glassBlur: 0.42,
	glassScattering: 0.3,
	glassHighlights: 0.72,
	glassShadows: 0.74,
	distortionShape: 'lens',
} as const

/**
 * 컨트롤러에 노출하지 않는 값의 묶음. 프리셋이 배경의 성격을 정하고, 노출된 컨트롤이 그 위를 조정한다.
 *
 * 🔴 rayRotation과 glassAngle은 모든 프리셋에서 0이다 — 수평은 의도된 것이라 프리셋이 기울이지 않는다.
 * 그래서 프리셋을 가르는 축은 질감(광선 밀도·축 감쇠·유리)과 구도(광원 축 위치) 둘뿐이다.
 */
export const LINEAR_FLUTED_GLASS_PRESETS = {
	basic: {},
	focused: {
		source: { x: -0.62, y: 0 },
		axisFalloff: 2.6,
		rayDensity: 0.45,
		rayMidIntensity: 0.22,
		glassEdgeSoftness: 0.2,
		glassBlur: 0.12,
		glassScattering: 0.1,
		glassHighlights: 0.9,
		glassShadows: 0.82,
		glassDistortion: 0.7,
		pulseIntensity: 0.1,
		pulseWidth: 0.14,
		flowSpeed: 0.04,
		glassDrift: { x: 0, y: 0.01 },
	},
	diffused: {
		source: { x: -0.62, y: 0.1 },
		axisFalloff: 0.7,
		rayDensity: 0.08,
		rayMidIntensity: 0.55,
		glassEdgeSoftness: 0.9,
		glassBlur: 0.85,
		glassScattering: 0.7,
		glassHighlights: 0.3,
		glassShadows: 0.4,
		glassDistortion: 0.35,
		paletteShift: 0.5,
		pulseIntensity: 0.45,
		pulseWidth: 0.45,
		pulseSpeed: 0.16,
		flowSpeed: 0.12,
	},
	// 광원 축을 크게 올려 밝은 대역을 위로 몰고 아래를 비운다. uSource.y = -source.y라 음수가 위다.
	upperAxis: {
		source: { x: -0.62, y: -0.7 },
		axisFalloff: 1.1,
		rayDensity: 0.3,
		rayMidIntensity: 0.4,
		glassEdgeSoftness: 0.45,
		glassBlur: 0.35,
		glassScattering: 0.3,
		glassHighlights: 0.8,
		glassShadows: 0.7,
		glassDistortion: 0.6,
		paletteShift: 1.6,
		pulseIntensity: 0.3,
		flowSpeed: 0.08,
	},
	lowerAxis: {
		source: { x: -0.62, y: 0.7 },
		axisFalloff: 1.1,
		rayDensity: 0.3,
		rayMidIntensity: 0.4,
		glassEdgeSoftness: 0.45,
		glassBlur: 0.35,
		glassScattering: 0.3,
		glassHighlights: 0.8,
		glassShadows: 0.7,
		glassDistortion: 0.6,
		paletteShift: 1.6,
		pulseIntensity: 0.3,
		flowSpeed: 0.08,
	},
} as const

export const LINEAR_FLUTED_GLASS_PRESET_IDS = Object.keys(
	LINEAR_FLUTED_GLASS_PRESETS,
) as readonly LinearFlutedGlassPresetId[]

export type LinearFlutedGlassPresetId = keyof typeof LINEAR_FLUTED_GLASS_PRESETS

type RangeControl = Extract<ControllerControlDefinition, { kind: 'range' }>

function rangeControl(
	id: string,
	label: string,
	defaultValue: number,
	min: number,
	max: number,
	step = 0.01,
	display: RangeControl['display'] = { precision: 2 },
): RangeControl {
	return { id, kind: 'range', label, defaultValue, min, max, step, display }
}

function colorControl(id: string, label: string, defaultValue: string) {
	return { id, kind: 'color' as const, label, defaultValue }
}

const linearFlutedGlassRuntimeManifest = defineGraphicRuntime({
	studio: 'graphic',
	id: 'linear-fluted-glass',
	version: 1,
	name: 'Linear Fluted Glass',
	type: 'shader',
	artifacts: {
		raster: {},
		video: {
			fps: [24, 30, 60],
			maxWidth: 1920,
			maxHeight: 1080,
			maxDurationSeconds: 10,
		},
	},
	controller: {
		groups: [
			{
				id: 'preset',
				title: 'Preset',
				controls: [
					{
						id: 'preset',
						kind: 'select' as const,
						label: '프리셋',
						defaultValue: 'basic',
						options: [
							{ value: 'basic', label: '기본' },
							{ value: 'focused', label: '집중' },
							{ value: 'diffused', label: '확산' },
							{ value: 'upperAxis', label: '상단 축' },
							{ value: 'lowerAxis', label: '하단 축' },
						],
					},
				],
			},
			{
				id: 'ray-palette',
				title: 'Ray Palette',
				controls: [
					colorControl(
						'rayColor1',
						'광선 색상 1',
						LINEAR_FLUTED_GLASS_DEFAULT_INPUT.rayColor1,
					),
					colorControl(
						'rayColor2',
						'광선 색상 2',
						LINEAR_FLUTED_GLASS_DEFAULT_INPUT.rayColor2,
					),
					colorControl(
						'rayColor3',
						'광선 색상 3',
						LINEAR_FLUTED_GLASS_DEFAULT_INPUT.rayColor3,
					),
					colorControl(
						'rayColor4',
						'광선 색상 4',
						LINEAR_FLUTED_GLASS_DEFAULT_INPUT.rayColor4,
					),
					colorControl(
						'rayColor5',
						'광선 색상 5',
						LINEAR_FLUTED_GLASS_DEFAULT_INPUT.rayColor5,
					),
					rangeControl(
						'paletteDrift',
						'팔레트 위상 속도',
						LINEAR_FLUTED_GLASS_DEFAULT_INPUT.paletteDrift,
						-1,
						1,
					),
				],
			},
			{
				id: 'rays',
				title: 'Rays',
				controls: [
					rangeControl(
						'rayBloom',
						'블룸 강도',
						LINEAR_FLUTED_GLASS_DEFAULT_INPUT.rayBloom,
						0,
						1,
					),
					rangeControl(
						'rayIntensity',
						'광선 강도',
						LINEAR_FLUTED_GLASS_DEFAULT_INPUT.rayIntensity,
						0,
						1,
					),
					rangeControl(
						'raySpotty',
						'광선 연속성',
						LINEAR_FLUTED_GLASS_DEFAULT_INPUT.raySpotty,
						0,
						1,
					),
					rangeControl(
						'rayMidSize',
						'중앙광 두께',
						LINEAR_FLUTED_GLASS_DEFAULT_INPUT.rayMidSize,
						0,
						1,
					),
					// 🔴 최소가 0.1이라 정지가 불가능하다 — 정지 배경이 필요해지면 이 하한을 먼저 본다.
					rangeControl(
						'speed',
						'속도',
						LINEAR_FLUTED_GLASS_DEFAULT_INPUT.speed,
						0.1,
						1.4,
					),
					rangeControl(
						'rayScale',
						'광선 스케일',
						LINEAR_FLUTED_GLASS_DEFAULT_INPUT.rayScale,
						0.5,
						1.5,
					),
				],
			},
			{
				id: 'glass',
				title: 'Glass',
				controls: [
					rangeControl(
						'glassSize',
						'플루트 크기',
						LINEAR_FLUTED_GLASS_DEFAULT_INPUT.glassSize,
						0.1,
						1,
					),
					rangeControl(
						'ribCurve',
						'플루트 폭 커브',
						LINEAR_FLUTED_GLASS_DEFAULT_INPUT.ribCurve,
						0.2,
						3,
					),
					{
						id: 'distortionShape',
						kind: 'select' as const,
						label: '왜곡 형태',
						defaultValue: LINEAR_FLUTED_GLASS_DEFAULT_INPUT.distortionShape,
						options: [
							{ value: 'cascade', label: 'Cascade' },
							{ value: 'flat', label: 'Flat' },
							{ value: 'contour', label: 'Contour' },
							{ value: 'lens', label: 'Lens' },
						],
					},
				],
			},
		],
	},
} as const)

export default linearFlutedGlassRuntimeManifest
