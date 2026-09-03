import { defineGraphicRuntime } from '@/features/graphic-generation/graphic-runtimes/define-graphic-runtime'
import type { ControllerControlDefinition } from '@/modules/studio-controller/controller-definition'

/**
 * Fluted Glass의 네 모양. 「가로·세로」와 「스윕·방사」는 프로파일 넷으로 갈라져 있었는데,
 * 창작자가 고르는 축은 프로파일이 아니라 **모양 하나**여야 해서 한 런타임으로 합쳤다(2026-09-03).
 *
 * 🔑 모양이 바꾸는 것은 셰이더 프로그램이다 — uniform 하나가 아니다. 그래서 이 컨트롤은
 *    `controller.remountOn`에 들어가고, 만질 때마다 캔버스가 다시 뜬다.
 */
export const FLUTED_GLASS_SHAPES = ['linear', 'vertical', 'sweep', 'radial'] as const

export type FlutedGlassShape = (typeof FLUTED_GLASS_SHAPES)[number]

const FLUTED_GLASS_SHAPE_LABELS: Record<FlutedGlassShape, string> = {
	linear: '가로',
	vertical: '세로',
	sweep: '스윕',
	radial: '방사',
}

/**
 * 셰이더 원문과 uniform 배선을 공유하는 묶음.
 *
 * 세로는 가로 셰이더에 회전된 입력을 흘려 넣을 뿐이고(합치기 전에도 그랬다), 스윕·방사는 원문이
 * 서로 다르지만 uniform 이름이 같아 배선을 공유한다 — 스윕에만 있는 `uSweepSpeed`는 방사 프로그램에
 * 없으므로 location이 null이 되고 WebGL이 조용히 무시한다.
 */
export const FLUTED_GLASS_SHAPE_FAMILIES = {
	linear: 'linear',
	vertical: 'linear',
	sweep: 'sweep',
	radial: 'radial',
} as const satisfies Record<FlutedGlassShape, 'linear' | 'sweep' | 'radial'>

/** 모양이 정하는 감춘 값 묶음 — 합치기 전 네 프로파일의 기본값을 그대로 옮겨 왔다. */
const FLUTED_GLASS_LINEAR_INPUT = {
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

const FLUTED_GLASS_VERTICAL_INPUT = {
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

const FLUTED_GLASS_SWEEP_INPUT = {
	source: { x: 0, y: 0 },
	sourceOffsetX: 0,
	sourceOffsetY: -0.3,
	bloomColor: '#3dff8a',
	rayColor1: '#000e06',
	rayColor2: '#004218',
	rayColor3: '#008533',
	rayColor4: '#1af087',
	rayColor5: '#e0fff0',
	rayBackgroundColor: '#000302',
	rayBloom: 0.2,
	rayIntensity: 0.95,
	rayDensity: 1,
	raySpotty: 0.35,
	rayMidSize: 0.4,
	rayMidIntensity: 0.7,
	speed: 0.72,
	frameOffsetMs: 0,
	rayScale: 1,
	rayRotation: -6,
	sweepSpeed: 0.12,
	radialFalloff: 0.9,
	radialFlowSpeed: 0.1,
	pulseIntensity: 0.6,
	pulseSpeed: 0.2,
	pulseDensity: 0.85,
	pulseWidth: 0.3,
	glassSize: 0.82,
	glassAngle: 8,
	glassOriginOffset: { x: -0.035, y: 0.055 },
	glassOffset: 0,
	glassSpeed: -0.035,
	glassDrift: { x: 0.02, y: 0.042 },
	glassDriftSpeedX: 0.19,
	glassDriftSpeedY: 0.27,
	glassDistortion: 0.68,
	glassEdgeSoftness: 0.62,
	glassBlur: 0.4,
	glassScattering: 0.24,
	glassHighlights: 0.62,
	glassShadows: 0.48,
	glassSourceFadeStart: 0,
	glassSourceFadeEnd: 0.4,
	distortionShape: 'lens',
} as const

const FLUTED_GLASS_RADIAL_INPUT = {
	source: { x: -1, y: -1 },
	sourceOffsetX: 0,
	sourceOffsetY: 0,
	bloomColor: '#3dff8a',
	rayColor1: '#000e06',
	rayColor2: '#004218',
	rayColor3: '#008533',
	rayColor4: '#1af087',
	rayColor5: '#e0fff0',
	rayBackgroundColor: '#000302',
	rayBloom: 0.2,
	rayIntensity: 0.95,
	rayDensity: 1,
	raySpotty: 0.35,
	rayMidSize: 0.4,
	rayMidIntensity: 0.7,
	speed: 0.72,
	frameOffsetMs: 0,
	rayScale: 1,
	sweepSpeed: 0,
	rayRotation: -6,
	radialFalloff: 0.9,
	radialFlowSpeed: 0.1,
	pulseIntensity: 0.6,
	pulseSpeed: 0.2,
	pulseDensity: 0.85,
	pulseWidth: 0.3,
	glassSize: 0.82,
	glassAngle: 8,
	glassOriginOffset: { x: -0.035, y: 0.055 },
	glassOffset: 0,
	glassSpeed: -0.035,
	glassDrift: { x: 0.02, y: 0.042 },
	glassDriftSpeedX: 0.19,
	glassDriftSpeedY: 0.27,
	glassDistortion: 0.68,
	glassEdgeSoftness: 0.62,
	glassBlur: 0.4,
	glassScattering: 0.24,
	glassHighlights: 0.62,
	glassShadows: 0.48,
	glassSourceFadeStart: 0,
	glassSourceFadeEnd: 0.4,
	distortionShape: 'lens',
} as const

export const FLUTED_GLASS_SHAPE_INPUTS = {
	linear: FLUTED_GLASS_LINEAR_INPUT,
	vertical: FLUTED_GLASS_VERTICAL_INPUT,
	sweep: FLUTED_GLASS_SWEEP_INPUT,
	radial: FLUTED_GLASS_RADIAL_INPUT,
} as const

/**
 * 「스타일」 — 감춘 파라미터 ~14개를 정하는 값. 가로·세로에만 있다(스윕·방사는 프리셋이 없었다).
 *
 * 🔴 `axisStart`·`axisEnd`는 합치기 전 가로의 `upperAxis`·`lowerAxis`와 세로의 `leftAxis`·`rightAxis`다.
 *    값은 그대로고 이름만 모양과 무관하게 바꿨다 — 둘은 같은 프리셋에 광원 좌표만 다른 것이라,
 *    가로에서는 위·아래로 세로에서는 좌·우로 읽힌다.
 */
export const FLUTED_GLASS_STYLE_IDS = [
	'basic',
	'focused',
	'diffused',
	'axisStart',
	'axisEnd',
] as const

export type FlutedGlassStyleId = (typeof FLUTED_GLASS_STYLE_IDS)[number]

const FLUTED_GLASS_LINEAR_STYLES = {
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
	axisStart: {
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
	axisEnd: {
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

const FLUTED_GLASS_VERTICAL_STYLES = {
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
	axisStart: {
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
	axisEnd: {
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

/** 스타일이 있는 모양만 담는다 — 스윕·방사는 여기 없고, 스타일을 골라도 값이 바뀌지 않는다. */
export const FLUTED_GLASS_STYLES = {
	linear: FLUTED_GLASS_LINEAR_STYLES,
	vertical: FLUTED_GLASS_VERTICAL_STYLES,
} as const

const FLUTED_GLASS_STYLE_LABELS: Record<FlutedGlassStyleId, string> = {
	basic: '기본',
	focused: '집중',
	diffused: '확산',
	axisStart: '축 시작쪽',
	axisEnd: '축 끝쪽',
}

/**
 * 노출 컨트롤의 기본값.
 *
 * 🔴 프로파일이 하나가 되면서 **기본 색 조합도 하나**가 된다. 합치기 전에는 두 벌이었다
 *    (가로·세로 `#001a0b…` / 스윕·방사 `#000e06…`) — 더 진한 스윕·방사 쪽을 남겼다.
 *    「색 조합」은 모양과 독립인 축이므로 모양을 바꿔도 이 값은 따라오지 않는다.
 */
const CONTROL_DEFAULTS = {
	...FLUTED_GLASS_SWEEP_INPUT,
	// 가로 계열에만 있는 두 축은 그쪽 기본값을 쓴다.
	paletteDrift: FLUTED_GLASS_LINEAR_INPUT.paletteDrift,
	ribCurve: FLUTED_GLASS_LINEAR_INPUT.ribCurve,
} as const

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

const flutedGlassRuntimeManifest = defineGraphicRuntime({
	studio: 'graphic',
	id: 'fluted-glass',
	version: 1,
	name: 'Fluted Glass',
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
		/**
		 * 창작자에게 보여줄 축 — 색, 모양, 속도, 위치처럼 직관적이고 변화폭이 큰 것만 남긴다.
		 *
		 * 🔑 `speed`가 마스터 시계다(셰이더 원문의 `iTime * uGodraySpeed`). 나머지 속도는 전부
		 *    그렇게 스케일된 `time`을 곱하므로, 이 하나가 모든 움직임을 함께 늘리고 줄인다.
		 * 🔴 나머지 컨트롤은 **선언에서 빼기만 한다.** 지우지 않는다 — 창작자에게 감추더라도
		 *    manager는 Payload에서 그 값을 조정할 수 있어야 한다.
		 * 🔴 「스타일」은 가로·세로에만 값이 있다. 스윕·방사에서 고르면 아무것도 바뀌지 않는다 —
		 *    두 모양에는 원래 프리셋이 없었고, 새로 만드는 것은 새 look을 정하는 일이라 하지 않았다.
		 */
		basic: [
			'shape',
			'preset',
			'rayColor1',
			'rayColor2',
			'rayColor3',
			'rayColor4',
			'rayColor5',
			'rayBackgroundColor',
			'bloomColor',
			'speed',
			'source',
			'sourceOffsetX',
			'sourceOffsetY',
		],
		// 모양은 셰이더 프로그램을 갈아끼운다 — 살아 있는 런타임에 흘려 넣을 수 없다.
		remountOn: ['shape'],
		groups: [
			{
				id: 'shape',
				title: 'Shape',
				controls: [
					{
						id: 'shape',
						kind: 'select' as const,
						variant: 'segmented' as const,
						label: '모양',
						defaultValue: 'sweep' satisfies FlutedGlassShape,
						options: FLUTED_GLASS_SHAPES.map((id) => ({
							value: id,
							label: FLUTED_GLASS_SHAPE_LABELS[id],
						})),
					},
				],
			},
			{
				id: 'preset',
				title: 'Style',
				controls: [
					{
						id: 'preset',
						kind: 'select' as const,
						label: '스타일',
						defaultValue: 'basic' satisfies FlutedGlassStyleId,
						options: FLUTED_GLASS_STYLE_IDS.map((id) => ({
							value: id,
							label: FLUTED_GLASS_STYLE_LABELS[id],
						})),
					},
				],
			},
			{
				id: 'ray-palette',
				title: 'Ray Palette',
				controls: [
					colorControl('rayColor1', '광선 색상 1', CONTROL_DEFAULTS.rayColor1),
					colorControl('rayColor2', '광선 색상 2', CONTROL_DEFAULTS.rayColor2),
					colorControl('rayColor3', '광선 색상 3', CONTROL_DEFAULTS.rayColor3),
					colorControl('rayColor4', '광선 색상 4', CONTROL_DEFAULTS.rayColor4),
					colorControl('rayColor5', '광선 색상 5', CONTROL_DEFAULTS.rayColor5),
					// 배경과 블룸도 색이다 — 광선 5색만 열어 두면 브랜드 색조를 바꿔도 이 둘이 초록으로 남는다.
					colorControl(
						'rayBackgroundColor',
						'배경 색상',
						CONTROL_DEFAULTS.rayBackgroundColor,
					),
					// 가로 계열만 읽는다(스윕·방사 셰이더에는 uPaletteDrift가 없다).
					rangeControl(
						'paletteDrift',
						'팔레트 위상 속도',
						CONTROL_DEFAULTS.paletteDrift,
						-1,
						1,
					),
				],
			},
			{
				id: 'rays',
				title: 'Rays',
				controls: [
					colorControl('bloomColor', '블룸 색상', CONTROL_DEFAULTS.bloomColor),
					rangeControl('rayBloom', '블룸 강도', CONTROL_DEFAULTS.rayBloom, 0, 1),
					rangeControl('rayIntensity', '광선 강도', CONTROL_DEFAULTS.rayIntensity, 0, 1),
					rangeControl('rayDensity', '광선 밀도', CONTROL_DEFAULTS.rayDensity, 0, 1),
					rangeControl('raySpotty', '광선 연속성', CONTROL_DEFAULTS.raySpotty, 0, 1),
					rangeControl('rayMidSize', '중앙광 크기', CONTROL_DEFAULTS.rayMidSize, 0, 1),
					rangeControl(
						'rayMidIntensity',
						'중앙광 강도',
						CONTROL_DEFAULTS.rayMidIntensity,
						0,
						1,
					),
					rangeControl('speed', '속도', CONTROL_DEFAULTS.speed, 0, 2),
					rangeControl('rayScale', '광선 스케일', CONTROL_DEFAULTS.rayScale, 0.1, 2),
					rangeControl(
						'rayRotation',
						'광선 회전',
						CONTROL_DEFAULTS.rayRotation,
						-180,
						180,
						1,
						{ precision: 0, unit: '°' },
					),
					rangeControl(
						'frameOffsetMs',
						'프레임 오프셋',
						CONTROL_DEFAULTS.frameOffsetMs,
						0,
						1000,
						1,
						{ precision: 0, unit: 'ms' },
					),
				],
			},
			{
				id: 'sweep',
				title: 'Sweep',
				controls: [
					// 음수는 역방향 회전이다 — 광선 필드 전체가 광원을 축으로 돈다. 방사는 0(안 돈다).
					rangeControl('sweepSpeed', '스윕 속도', CONTROL_DEFAULTS.sweepSpeed, -1, 1),
					rangeControl('radialFalloff', '감쇠', CONTROL_DEFAULTS.radialFalloff, 0, 3),
					rangeControl(
						'radialFlowSpeed',
						'흐름 속도',
						CONTROL_DEFAULTS.radialFlowSpeed,
						0,
						1,
					),
					rangeControl(
						'pulseIntensity',
						'빔 강도',
						CONTROL_DEFAULTS.pulseIntensity,
						0,
						2,
					),
					rangeControl('pulseSpeed', '빔 위상 속도', CONTROL_DEFAULTS.pulseSpeed, 0, 2),
					rangeControl('pulseDensity', '빔 밀도', CONTROL_DEFAULTS.pulseDensity, 0.1, 4),
					rangeControl('pulseWidth', '빔 폭', CONTROL_DEFAULTS.pulseWidth, 0.01, 0.5),
				],
			},
			{
				id: 'glass',
				title: 'Glass',
				controls: [
					rangeControl('glassSize', '플루트 크기', CONTROL_DEFAULTS.glassSize, 0, 1),
					// 가로 계열만 읽는다(스윕·방사 셰이더에는 uRibCurve가 없다).
					rangeControl('ribCurve', '플루트 폭 커브', CONTROL_DEFAULTS.ribCurve, 0.2, 3),
					rangeControl(
						'glassDistortion',
						'유리 왜곡',
						CONTROL_DEFAULTS.glassDistortion,
						0,
						1,
					),
					{
						id: 'distortionShape',
						kind: 'select' as const,
						label: '왜곡 형태',
						defaultValue: CONTROL_DEFAULTS.distortionShape,
						options: [
							{ value: 'cascade', label: 'Cascade' },
							{ value: 'flat', label: 'Flat' },
							{ value: 'contour', label: 'Contour' },
							{ value: 'lens', label: 'Lens' },
						],
					},
					rangeControl(
						'glassAngle',
						'플루트 각도',
						CONTROL_DEFAULTS.glassAngle,
						-180,
						180,
						1,
						{ precision: 0, unit: '°' },
					),
					rangeControl(
						'glassEdgeSoftness',
						'경계 부드러움',
						CONTROL_DEFAULTS.glassEdgeSoftness,
						0,
						1,
					),
					rangeControl('glassBlur', '블러', CONTROL_DEFAULTS.glassBlur, 0, 1),
					rangeControl('glassScattering', '산란', CONTROL_DEFAULTS.glassScattering, 0, 1),
					rangeControl(
						'glassHighlights',
						'하이라이트',
						CONTROL_DEFAULTS.glassHighlights,
						0,
						1,
					),
					rangeControl('glassShadows', '그림자', CONTROL_DEFAULTS.glassShadows, 0, 1),
					// 스윕·방사 계열만 읽는다.
					rangeControl(
						'glassSourceFadeStart',
						'광원 페이드 시작',
						CONTROL_DEFAULTS.glassSourceFadeStart,
						0,
						0.34,
					),
					rangeControl(
						'glassSourceFadeEnd',
						'광원 페이드 끝',
						CONTROL_DEFAULTS.glassSourceFadeEnd,
						0.34,
						1,
					),
				],
			},
			{
				id: 'glass-motion',
				title: 'Glass Motion',
				controls: [
					{
						id: 'glassOriginOffset',
						kind: 'pad' as const,
						label: '유리 원점 오프셋',
						defaultValue: CONTROL_DEFAULTS.glassOriginOffset,
					},
					rangeControl(
						'glassOffset',
						'플루트 오프셋',
						CONTROL_DEFAULTS.glassOffset,
						-2,
						2,
					),
					rangeControl('glassSpeed', '플루트 속도', CONTROL_DEFAULTS.glassSpeed, -1, 1),
					{
						id: 'glassDrift',
						kind: 'pad' as const,
						label: '드리프트 범위',
						defaultValue: CONTROL_DEFAULTS.glassDrift,
					},
					rangeControl(
						'glassDriftSpeedX',
						'드리프트 X 속도',
						CONTROL_DEFAULTS.glassDriftSpeedX,
						0,
						2,
					),
					rangeControl(
						'glassDriftSpeedY',
						'드리프트 Y 속도',
						CONTROL_DEFAULTS.glassDriftSpeedY,
						0,
						2,
					),
				],
			},
			{
				id: 'position',
				title: 'Position',
				controls: [
					{
						id: 'source',
						kind: 'pad' as const,
						label: '광원',
						defaultValue: CONTROL_DEFAULTS.source,
					},
					rangeControl(
						'sourceOffsetX',
						'광원 X 오프셋',
						CONTROL_DEFAULTS.sourceOffsetX,
						-2,
						2,
					),
					rangeControl(
						'sourceOffsetY',
						'광원 Y 오프셋',
						CONTROL_DEFAULTS.sourceOffsetY,
						-2,
						2,
					),
				],
			},
		],
	},
} as const)

export default flutedGlassRuntimeManifest
