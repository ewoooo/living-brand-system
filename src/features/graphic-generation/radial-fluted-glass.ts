import { z } from 'zod'
import {
	type ControllerValues,
	isControllerPadValue,
} from '@/modules/studio-controller/controller-definition'

const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i)

export const radialFlutedGlassInputSchema = z.strictObject({
	source: z.strictObject({
		x: z.number().min(-1).max(1),
		y: z.number().min(-1).max(1),
	}),
	bloomColor: hexColorSchema,
	rayIntensity: z.number().min(0).max(1),
	rayDensity: z.number().min(0).max(1),
	speed: z.number().min(0).max(2),
	glassSize: z.number().min(0).max(1),
	glassDistortion: z.number().min(0).max(1),
})

export type RadialFlutedGlassInput = z.infer<typeof radialFlutedGlassInputSchema>

export const RADIAL_FLUTED_GLASS_DEFAULT_INPUT = {
	source: { x: -0.96, y: 0 },
	bloomColor: '#3dff8a',
	rayIntensity: 0.82,
	rayDensity: 0.34,
	speed: 0.72,
	glassSize: 0.82,
	glassDistortion: 0.68,
} satisfies RadialFlutedGlassInput

/** Controller 값을 Radial Fluted Glass shader uniform 입력으로 검증한다. */
export function toRadialFlutedGlassInput(values: ControllerValues): RadialFlutedGlassInput {
	return radialFlutedGlassInputSchema.parse({
		source: isControllerPadValue(values.source) ? values.source : undefined,
		bloomColor: values.bloomColor ?? RADIAL_FLUTED_GLASS_DEFAULT_INPUT.bloomColor,
		rayIntensity: values.rayIntensity,
		rayDensity: values.rayDensity,
		speed: values.speed,
		glassSize: values.glassSize,
		glassDistortion: values.glassDistortion,
	})
}

export function radialFlutedGlassColorToRgb(color: string): readonly [number, number, number] {
	const value = hexColorSchema.parse(color).slice(1)
	return [0, 2, 4].map(
		(offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255,
	) as [number, number, number]
}

/** 화면 좌표(아래가 +Y)를 WebGL 좌표(위가 +Y)로 바꾼다. */
export function toRadialFlutedGlassShaderSource(
	source: RadialFlutedGlassInput['source'],
): readonly [number, number] {
	return [source.x, -source.y]
}
