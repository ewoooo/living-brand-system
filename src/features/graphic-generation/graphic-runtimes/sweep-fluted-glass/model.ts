import { z } from 'zod'
import type { GraphicModelAdapter } from '@/features/graphic-generation/runtime/graphic-plugin'
import {
	type ControllerRuntimeBindings,
	type ControllerValues,
	isControllerPadValue,
} from '@/modules/studio-controller/controller-definition'
import { SWEEP_FLUTED_GLASS_DEFAULT_INPUT } from './definition'

export { SWEEP_FLUTED_GLASS_DEFAULT_INPUT } from './definition'

const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i)

export const sweepFlutedGlassInputSchema = z.strictObject({
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
	sweepSpeed: z.number().min(-1).max(1),
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

export type SweepFlutedGlassInput = z.infer<typeof sweepFlutedGlassInputSchema>

/** Controller 값을 Sweep Fluted Glass shader uniform 입력으로 검증한다. */
export function toSweepFlutedGlassInput(values: ControllerValues): SweepFlutedGlassInput {
	// 🔑 기본 입력을 통째로 깔고 컨트롤 값으로만 덮는다(linear와 같은 패턴).
	//    그래서 컨트롤 선언을 지우면 그 축은 자동으로 정본 기본값으로 고정된다.
	const base = SWEEP_FLUTED_GLASS_DEFAULT_INPUT
	return sweepFlutedGlassInputSchema.parse({
		...base,
		source: isControllerPadValue(values.source) ? values.source : base.source,
		sourceOffsetX: values.sourceOffsetX ?? base.sourceOffsetX,
		sourceOffsetY: values.sourceOffsetY ?? base.sourceOffsetY,
		bloomColor: values.bloomColor ?? base.bloomColor,
		rayColor1: values.rayColor1 ?? base.rayColor1,
		rayColor2: values.rayColor2 ?? base.rayColor2,
		rayColor3: values.rayColor3 ?? base.rayColor3,
		rayColor4: values.rayColor4 ?? base.rayColor4,
		rayColor5: values.rayColor5 ?? base.rayColor5,
		rayBackgroundColor: values.rayBackgroundColor ?? base.rayBackgroundColor,
		rayBloom: values.rayBloom ?? base.rayBloom,
		rayIntensity: values.rayIntensity ?? base.rayIntensity,
		rayDensity: values.rayDensity ?? base.rayDensity,
		raySpotty: values.raySpotty ?? base.raySpotty,
		rayMidSize: values.rayMidSize ?? base.rayMidSize,
		rayMidIntensity: values.rayMidIntensity ?? base.rayMidIntensity,
		speed: values.speed ?? base.speed,
		frameOffsetMs: values.frameOffsetMs ?? base.frameOffsetMs,
		rayScale: values.rayScale ?? base.rayScale,
		rayRotation: values.rayRotation ?? base.rayRotation,
		sweepSpeed: values.sweepSpeed ?? base.sweepSpeed,
		radialFalloff: values.radialFalloff ?? base.radialFalloff,
		radialFlowSpeed: values.radialFlowSpeed ?? base.radialFlowSpeed,
		pulseIntensity: values.pulseIntensity ?? base.pulseIntensity,
		pulseSpeed: values.pulseSpeed ?? base.pulseSpeed,
		pulseDensity: values.pulseDensity ?? base.pulseDensity,
		pulseWidth: values.pulseWidth ?? base.pulseWidth,
		glassSize: values.glassSize ?? base.glassSize,
		glassAngle: values.glassAngle ?? base.glassAngle,
		glassOriginOffset: isControllerPadValue(values.glassOriginOffset)
			? values.glassOriginOffset
			: base.glassOriginOffset,
		glassOffset: values.glassOffset ?? base.glassOffset,
		glassSpeed: values.glassSpeed ?? base.glassSpeed,
		glassDrift: isControllerPadValue(values.glassDrift) ? values.glassDrift : base.glassDrift,
		glassDriftSpeedX: values.glassDriftSpeedX ?? base.glassDriftSpeedX,
		glassDriftSpeedY: values.glassDriftSpeedY ?? base.glassDriftSpeedY,
		glassDistortion: values.glassDistortion ?? base.glassDistortion,
		glassEdgeSoftness: values.glassEdgeSoftness ?? base.glassEdgeSoftness,
		glassBlur: values.glassBlur ?? base.glassBlur,
		glassScattering: values.glassScattering ?? base.glassScattering,
		glassHighlights: values.glassHighlights ?? base.glassHighlights,
		glassShadows: values.glassShadows ?? base.glassShadows,
		glassSourceFadeStart: values.glassSourceFadeStart ?? base.glassSourceFadeStart,
		glassSourceFadeEnd: values.glassSourceFadeEnd ?? base.glassSourceFadeEnd,
		distortionShape: values.distortionShape ?? base.distortionShape,
	})
}

export function sweepFlutedGlassColorToRgb(color: string): readonly [number, number, number] {
	const value = hexColorSchema.parse(color).slice(1)
	return [0, 2, 4].map(
		(offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255,
	) as [number, number, number]
}

/** 화면 좌표(아래가 +Y)를 WebGL 좌표(위가 +Y)로 바꾼다. */
export function toSweepFlutedGlassShaderPoint(
	point: {
		x: number
		y: number
	},
	offset: { x: number; y: number } = { x: 0, y: 0 },
): readonly [number, number] {
	return [point.x + offset.x, -(point.y + offset.y)]
}

const DISTORTION_SHAPE_UNIFORMS: Record<SweepFlutedGlassInput['distortionShape'], number> = {
	cascade: 0,
	flat: 1,
	contour: 2,
	lens: 3,
}

export function sweepFlutedGlassDistortionShapeToUniform(
	shape: SweepFlutedGlassInput['distortionShape'],
) {
	return DISTORTION_SHAPE_UNIFORMS[shape]
}

const sweepFlutedGlassModel = {
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

export default sweepFlutedGlassModel
