import { defineGraphicRuntime } from '@/features/graphic-generation/graphic-runtimes/define-graphic-runtime'
import type { ControllerControlDefinition } from '@/modules/studio-controller/controller-definition'

/**
 * Linear Fluted Glass의 세로 변형. 셰이더·모델 지반은 linear가 소유하고,
 * 이 런타임은 축을 세로로 굽는 기본값과 프리셋만 소유한다.
 *
 * 🔴 rayRotation -90(광선이 위→아래로 흐른다)·glassAngle 90(리브가 세로로 선다)은
 * 이 런타임의 정체성이라 프리셋이 건드리지 않는다.
 */
export const VERTICAL_FLUTED_GLASS_DEFAULT_INPUT = {
	source: { x: 0, y: -0.62 },
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
	rayRotation: -90,
	axisFalloff: 1.7,
	flowSpeed: 0.06,
	paletteShift: 1.2,
	paletteDrift: 0.75,
	pulseIntensity: 0.3,
	pulseSpeed: 0.28,
	pulseDensity: 0.9,
	pulseWidth: 0.22,
	glassSize: 0.92,
	ribCurve: 1.7,
	glassAngle: 90,
	glassOriginOffset: { x: 0, y: 0 },
	glassOffset: 0,
	glassSpeed: -0.02,
	glassDrift: { x: 0.03, y: 0 },
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
 * linear의 프리셋에서 축 위치만 세로 좌표계로 옮겼다 — 광원은 상단(y=-0.62)에 고정되고,
 * 프리셋을 가르는 축 위치는 source.x가 맡는다(음수가 왼쪽).
 */
export const VERTICAL_FLUTED_GLASS_PRESETS = {
	basic: {},
	focused: {
		source: { x: 0, y: -0.62 },
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
		glassDrift: { x: 0.01, y: 0 },
	},
	diffused: {
		source: { x: 0.1, y: -0.62 },
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
	leftAxis: {
		source: { x: -0.7, y: -0.62 },
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
	rightAxis: {
		source: { x: 0.7, y: -0.62 },
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

export const VERTICAL_FLUTED_GLASS_PRESET_IDS = Object.keys(
	VERTICAL_FLUTED_GLASS_PRESETS,
) as readonly VerticalFlutedGlassPresetId[]

export type VerticalFlutedGlassPresetId = keyof typeof VERTICAL_FLUTED_GLASS_PRESETS

/**
 * 프리셋 select에 쓰는 사람이 읽는 이름.
 *
 * Record 타입이 프리셋 목록과 묶어 두므로, 프리셋을 더하거나 지우면 여기서 타입이 깨진다 —
 * 옵션을 잊어 화면에 안 뜨거나 없는 프리셋을 고를 수 있게 되는 어긋남을 컴파일에서 잡는다.
 */
const VERTICAL_FLUTED_GLASS_PRESET_LABELS: Record<VerticalFlutedGlassPresetId, string> = {
	basic: '기본',
	focused: '집중',
	diffused: '확산',
	leftAxis: '좌측 축',
	rightAxis: '우측 축',
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

const verticalFlutedGlassRuntimeManifest = defineGraphicRuntime({
	studio: 'graphic',
	id: 'vertical-fluted-glass',
	version: 1,
	name: 'Vertical Fluted Glass',
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
						defaultValue: 'basic' satisfies VerticalFlutedGlassPresetId,
						options: VERTICAL_FLUTED_GLASS_PRESET_IDS.map((id) => ({
							value: id,
							label: VERTICAL_FLUTED_GLASS_PRESET_LABELS[id],
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
						VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.rayColor1,
					),
					colorControl(
						'rayColor2',
						'광선 색상 2',
						VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.rayColor2,
					),
					colorControl(
						'rayColor3',
						'광선 색상 3',
						VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.rayColor3,
					),
					colorControl(
						'rayColor4',
						'광선 색상 4',
						VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.rayColor4,
					),
					colorControl(
						'rayColor5',
						'광선 색상 5',
						VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.rayColor5,
					),
					// 배경과 블룸도 색이다 — 광선 5색만 열어 두면 브랜드 색조를 바꿔도 이 둘이 초록으로 남는다.
					colorControl(
						'rayBackgroundColor',
						'배경 색상',
						VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.rayBackgroundColor,
					),
					rangeControl(
						'paletteDrift',
						'팔레트 위상 속도',
						VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.paletteDrift,
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
						VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.bloomColor,
					),
					rangeControl(
						'rayBloom',
						'블룸 강도',
						VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.rayBloom,
						0,
						1,
					),
					rangeControl(
						'rayIntensity',
						'광선 강도',
						VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.rayIntensity,
						0,
						1,
					),
					rangeControl(
						'raySpotty',
						'광선 연속성',
						VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.raySpotty,
						0,
						1,
					),
					rangeControl(
						'rayMidSize',
						'중앙광 두께',
						VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.rayMidSize,
						0,
						1,
					),
					// 🔴 최소가 0.1이라 정지가 불가능하다 — 정지 배경이 필요해지면 이 하한을 먼저 본다.
					rangeControl(
						'speed',
						'속도',
						VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.speed,
						0.1,
						1.4,
					),
					rangeControl(
						'rayScale',
						'광선 스케일',
						VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.rayScale,
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
						VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.glassSize,
						0.1,
						1,
					),
					rangeControl(
						'ribCurve',
						'플루트 폭 커브',
						VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.ribCurve,
						0.2,
						3,
					),
					{
						id: 'distortionShape',
						kind: 'select' as const,
						label: '왜곡 형태',
						defaultValue: VERTICAL_FLUTED_GLASS_DEFAULT_INPUT.distortionShape,
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

export default verticalFlutedGlassRuntimeManifest
