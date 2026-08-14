import { z } from 'zod'
import type { GraphicModelAdapter } from '@/features/graphic-generation/runtime/graphic-plugin'
import {
	type ControllerRuntimeBindings,
	type ControllerValues,
	isControllerPadValue,
} from '@/modules/studio-controller/controller-definition'
import { RADIAL_FLUTED_GLASS_DEFAULT_INPUT } from './definition'

export { RADIAL_FLUTED_GLASS_DEFAULT_INPUT } from './definition'

const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i)

export const radialFlutedGlassInputSchema = z.strictObject({
	source: z.strictObject({
		x: z.number().min(-1).max(1),
		y: z.number().min(-1).max(1),
	}),
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
	radialFalloff: z.number().min(0).max(3),
	radialFlowSpeed: z.number().min(0).max(1),
	pulseIntensity: z.number().min(0).max(2),
	pulseSpeed: z.number().min(0).max(2),
	pulseDensity: z.number().min(0.1).max(4),
	pulseWidth: z.number().min(0.01).max(0.5),
	glassSize: z.number().min(0).max(1),
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
	glassSourceFadeStart: z.number().min(0).max(0.34),
	glassSourceFadeEnd: z.number().min(0.34).max(1),
	distortionShape: z.enum(['cascade', 'flat', 'contour', 'lens']),
})

export type RadialFlutedGlassInput = z.infer<typeof radialFlutedGlassInputSchema>

/** Controller 값을 Radial Fluted Glass shader uniform 입력으로 검증한다. */
export function toRadialFlutedGlassInput(values: ControllerValues): RadialFlutedGlassInput {
	return radialFlutedGlassInputSchema.parse({
		source: isControllerPadValue(values.source) ? values.source : undefined,
		bloomColor: values.bloomColor ?? RADIAL_FLUTED_GLASS_DEFAULT_INPUT.bloomColor,
		rayColor1: values.rayColor1 ?? RADIAL_FLUTED_GLASS_DEFAULT_INPUT.rayColor1,
		rayColor2: values.rayColor2 ?? RADIAL_FLUTED_GLASS_DEFAULT_INPUT.rayColor2,
		rayColor3: values.rayColor3 ?? RADIAL_FLUTED_GLASS_DEFAULT_INPUT.rayColor3,
		rayColor4: values.rayColor4 ?? RADIAL_FLUTED_GLASS_DEFAULT_INPUT.rayColor4,
		rayColor5: values.rayColor5 ?? RADIAL_FLUTED_GLASS_DEFAULT_INPUT.rayColor5,
		rayBackgroundColor:
			values.rayBackgroundColor ?? RADIAL_FLUTED_GLASS_DEFAULT_INPUT.rayBackgroundColor,
		rayBloom: values.rayBloom,
		rayIntensity: values.rayIntensity,
		rayDensity: values.rayDensity,
		raySpotty: values.raySpotty,
		rayMidSize: values.rayMidSize,
		rayMidIntensity: values.rayMidIntensity,
		speed: values.speed,
		frameOffsetMs: values.frameOffsetMs,
		rayScale: values.rayScale,
		rayRotation: values.rayRotation,
		radialFalloff: values.radialFalloff,
		radialFlowSpeed: values.radialFlowSpeed,
		pulseIntensity: values.pulseIntensity,
		pulseSpeed: values.pulseSpeed,
		pulseDensity: values.pulseDensity,
		pulseWidth: values.pulseWidth,
		glassSize: values.glassSize,
		glassAngle: values.glassAngle,
		glassOriginOffset: isControllerPadValue(values.glassOriginOffset)
			? values.glassOriginOffset
			: undefined,
		glassOffset: values.glassOffset,
		glassSpeed: values.glassSpeed,
		glassDrift: isControllerPadValue(values.glassDrift) ? values.glassDrift : undefined,
		glassDriftSpeedX: values.glassDriftSpeedX,
		glassDriftSpeedY: values.glassDriftSpeedY,
		glassDistortion: values.glassDistortion,
		glassEdgeSoftness: values.glassEdgeSoftness,
		glassBlur: values.glassBlur,
		glassScattering: values.glassScattering,
		glassHighlights: values.glassHighlights,
		glassShadows: values.glassShadows,
		glassSourceFadeStart: values.glassSourceFadeStart,
		glassSourceFadeEnd: values.glassSourceFadeEnd,
		distortionShape: values.distortionShape,
	})
}

export function radialFlutedGlassColorToRgb(color: string): readonly [number, number, number] {
	const value = hexColorSchema.parse(color).slice(1)
	return [0, 2, 4].map(
		(offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255,
	) as [number, number, number]
}

/** 화면 좌표(아래가 +Y)를 WebGL 좌표(위가 +Y)로 바꾼다. */
export function toRadialFlutedGlassShaderPoint(point: {
	x: number
	y: number
}): readonly [number, number] {
	return [point.x, -point.y]
}

const DISTORTION_SHAPE_UNIFORMS: Record<RadialFlutedGlassInput['distortionShape'], number> = {
	cascade: 0,
	flat: 1,
	contour: 2,
	lens: 3,
}

export function radialFlutedGlassDistortionShapeToUniform(
	shape: RadialFlutedGlassInput['distortionShape'],
) {
	return DISTORTION_SHAPE_UNIFORMS[shape]
}

const radialFlutedGlassModel = {
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

export default radialFlutedGlassModel
