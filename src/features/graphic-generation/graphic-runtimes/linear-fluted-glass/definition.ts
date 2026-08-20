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
	rayBloom: 1,
	rayIntensity: 0.9,
	rayDensity: 0.22,
	raySpotty: 0.86,
	rayMidSize: 0.75,
	rayMidIntensity: 0.32,
	speed: 1.2,
	frameOffsetMs: 0,
	rayScale: 1,
	rayRotation: 0,
	axisFalloff: 1.7,
	flowSpeed: 0.06,
	paletteShift: 1.2,
	paletteDrift: -0.2,
	pulseIntensity: 0.3,
	pulseSpeed: 0.28,
	pulseDensity: 0.9,
	pulseWidth: 0.22,
	glassSize: 0.92,
	ribCurve: 1.7,
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

/**
 * 프리셋 select에 쓰는 사람이 읽는 이름.
 *
 * Record 타입이 프리셋 목록과 묶어 두므로, 프리셋을 더하거나 지우면 여기서 타입이 깨진다 —
 * 옵션을 잊어 화면에 안 뜨거나 없는 프리셋을 고를 수 있게 되는 어긋남을 컴파일에서 잡는다.
 */
const LINEAR_FLUTED_GLASS_PRESET_LABELS: Record<LinearFlutedGlassPresetId, string> = {
	basic: '기본',
	focused: '집중',
	diffused: '확산',
	upperAxis: '상단 축',
	lowerAxis: '하단 축',
}

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
						defaultValue: 'basic' satisfies LinearFlutedGlassPresetId,
						options: LINEAR_FLUTED_GLASS_PRESET_IDS.map((id) => ({
							value: id,
							label: LINEAR_FLUTED_GLASS_PRESET_LABELS[id],
						})),
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
					// 배경과 블룸도 색이다 — 광선 5색만 열어 두면 브랜드 색조를 바꿔도 이 둘이 초록으로 남는다.
					colorControl(
						'rayBackgroundColor',
						'배경 색상',
						LINEAR_FLUTED_GLASS_DEFAULT_INPUT.rayBackgroundColor,
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
					colorControl(
						'bloomColor',
						'블룸 색상',
						LINEAR_FLUTED_GLASS_DEFAULT_INPUT.bloomColor,
					),
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
