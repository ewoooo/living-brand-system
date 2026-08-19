import { z } from 'zod'
import type { GraphicModelAdapter } from '@/features/graphic-generation/runtime/graphic-plugin'
import type {
	ControllerControlValue,
	ControllerRuntimeBindings,
	ControllerValues,
} from '@/modules/studio-controller/controller-definition'
import {
	LINEAR_FLUTED_GLASS_DEFAULT_INPUT,
	LINEAR_FLUTED_GLASS_PRESETS,
	type LinearFlutedGlassPresetId,
} from './definition'

export { LINEAR_FLUTED_GLASS_DEFAULT_INPUT } from './definition'

const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i)

export const linearFlutedGlassInputSchema = z.strictObject({
	source: z.strictObject({
		x: z.number().min(-1).max(1),
		y: z.number().min(-1).max(1),
	}),
	sourceOffsetX: z.number().min(-2).max(2),
	sourceOffsetY: z.number().min(-2).max(2),
	bloomColor: hexColorSchema,
	rayColor1: hexColorSchema,
	rayColor2: hexColorSchema,
	rayColor3: hexColorSchema,
	rayColor4: hexColorSchema,
	rayColor5: hexColorSchema,
	rayBackgroundColor: hexColorSchema,
	rayBloom: z.number().min(0).max(1),
	rayIntensity: z.number().min(0).max(1),
	rayDensity: z.number().min(0).max(1),
	raySpotty: z.number().min(0).max(1),
	rayMidSize: z.number().min(0).max(1),
	rayMidIntensity: z.number().min(0).max(1),
	speed: z.number().min(0).max(2),
	frameOffsetMs: z.number().min(0).max(1000),
	rayScale: z.number().min(0.1).max(2),
	rayRotation: z.number().min(-180).max(180),
	axisFalloff: z.number().min(0).max(3),
	flowSpeed: z.number().min(0).max(1),
	paletteShift: z.number().min(0).max(4),
	paletteDrift: z.number().min(-1).max(1),
	pulseIntensity: z.number().min(0).max(2),
	pulseSpeed: z.number().min(0).max(2),
	pulseDensity: z.number().min(0.1).max(4),
	pulseWidth: z.number().min(0.01).max(0.5),
	glassSize: z.number().min(0).max(1),
	ribCurve: z.number().min(0.2).max(3),
	glassAngle: z.number().min(-180).max(180),
	glassOriginOffset: z.strictObject({
		x: z.number().min(-1).max(1),
		y: z.number().min(-1).max(1),
	}),
	glassOffset: z.number().min(-2).max(2),
	glassSpeed: z.number().min(-1).max(1),
	glassDrift: z.strictObject({
		x: z.number().min(-1).max(1),
		y: z.number().min(-1).max(1),
	}),
	glassDriftSpeedX: z.number().min(0).max(2),
	glassDriftSpeedY: z.number().min(0).max(2),
	glassDistortion: z.number().min(0).max(1),
	glassEdgeSoftness: z.number().min(0).max(1),
	glassBlur: z.number().min(0).max(1),
	glassScattering: z.number().min(0).max(1),
	glassHighlights: z.number().min(0).max(1),
	glassShadows: z.number().min(0).max(1),
	distortionShape: z.enum(['cascade', 'flat', 'contour', 'lens']),
})

export type LinearFlutedGlassInput = z.infer<typeof linearFlutedGlassInputSchema>

/** 컨트롤러가 고른 프리셋. 알 수 없는 값이면 기본으로 떨어진다 — 저장된 값이 낡아도 화면은 뜬다. */
function resolveLinearFlutedGlassPreset(value: ControllerControlValue) {
	const id = typeof value === 'string' ? value : ''
	return id in LINEAR_FLUTED_GLASS_PRESETS
		? LINEAR_FLUTED_GLASS_PRESETS[id as LinearFlutedGlassPresetId]
		: LINEAR_FLUTED_GLASS_PRESETS.basic
}

/**
 * Controller 값을 shader uniform 입력으로 검증한다.
 *
 * 컨트롤러는 노출된 값만 갖는다 — 나머지는 프리셋이 정한다. 셰이더는 여전히 전체 uniform을
 * 요구하므로 여기서 기본값 → 프리셋 → 노출 값 순으로 덮어 완전한 입력을 만든다.
 */
export function toLinearFlutedGlassInput(values: ControllerValues): LinearFlutedGlassInput {
	const base = {
		...LINEAR_FLUTED_GLASS_DEFAULT_INPUT,
		...resolveLinearFlutedGlassPreset(values.preset),
	}
	return linearFlutedGlassInputSchema.parse({
		...base,
		rayColor1: values.rayColor1 ?? base.rayColor1,
		rayColor2: values.rayColor2 ?? base.rayColor2,
		rayColor3: values.rayColor3 ?? base.rayColor3,
		rayColor4: values.rayColor4 ?? base.rayColor4,
		rayColor5: values.rayColor5 ?? base.rayColor5,
		paletteDrift: values.paletteDrift ?? base.paletteDrift,
		rayBloom: values.rayBloom ?? base.rayBloom,
		rayIntensity: values.rayIntensity ?? base.rayIntensity,
		raySpotty: values.raySpotty ?? base.raySpotty,
		rayMidSize: values.rayMidSize ?? base.rayMidSize,
		speed: values.speed ?? base.speed,
		rayScale: values.rayScale ?? base.rayScale,
		glassSize: values.glassSize ?? base.glassSize,
		ribCurve: values.ribCurve ?? base.ribCurve,
		distortionShape: values.distortionShape ?? base.distortionShape,
	})
}

export function linearFlutedGlassColorToRgb(color: string): readonly [number, number, number] {
	const value = hexColorSchema.parse(color).slice(1)
	return [0, 2, 4].map(
		(offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255,
	) as [number, number, number]
}

/** 화면 좌표(아래가 +Y)를 WebGL 좌표(위가 +Y)로 바꾼다. */
export function toLinearFlutedGlassShaderPoint(
	point: {
		x: number
		y: number
	},
	offset: { x: number; y: number } = { x: 0, y: 0 },
): readonly [number, number] {
	return [point.x + offset.x, -(point.y + offset.y)]
}

const DISTORTION_SHAPE_UNIFORMS: Record<LinearFlutedGlassInput['distortionShape'], number> = {
	cascade: 0,
	flat: 1,
	contour: 2,
	lens: 3,
}

export function linearFlutedGlassDistortionShapeToUniform(
	shape: LinearFlutedGlassInput['distortionShape'],
) {
	return DISTORTION_SHAPE_UNIFORMS[shape]
}

const linearFlutedGlassModel = {
	getBindings: (viewport: { width: number; height: number }): ControllerRuntimeBindings =>
		viewport.width > 0 && viewport.height > 0
			? Object.fromEntries(
					['source', 'glassOriginOffset', 'glassDrift'].map((id) => [
						id,
						{ padAspectRatio: viewport.width / viewport.height },
					]),
				)
			: {},
} satisfies GraphicModelAdapter

export default linearFlutedGlassModel
