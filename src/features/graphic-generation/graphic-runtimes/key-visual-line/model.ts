import { z } from 'zod'
import type { GraphicModelAdapter } from '@/features/graphic-generation/runtime/graphic-plugin'
import type { VectorSceneArtifact } from '@/modules/studio-artifact/studio-artifact'
import {
	type ControllerControlValue,
	type ControllerPadValue,
	type ControllerRuntimeBindings,
	type ControllerValues,
	isControllerPadPairValue,
} from '@/modules/studio-controller/controller-definition'
import {
	KEY_VISUAL_LINE_COLORWAYS,
	KEY_VISUAL_LINE_DEFAULT_INPUT,
	KEY_VISUAL_LINE_REFERENCE_BASE,
	type KeyVisualLineColorwayId,
} from './definition'

export { KEY_VISUAL_LINE_DEFAULT_INPUT, KEY_VISUAL_LINE_REFERENCE_BASE } from './definition'

const colorwayIds = Object.keys(KEY_VISUAL_LINE_COLORWAYS) as KeyVisualLineColorwayId[]

const pointSchema = z.strictObject({
	x: z.number().min(0).max(1),
	y: z.number().min(0).max(1),
})

export const keyVisualLineInputSchema = z.strictObject({
	colorway: z.enum(colorwayIds),
	lineCount: z.number().int().min(4).max(24),
	angleStart: z.number().min(0).max(180),
	angleSpread: z.number().min(-90).max(90),
	lengthStart: z.number().min(60).max(600),
	lengthEnd: z.number().min(4).max(600),
	weightThin: z.number().min(1).max(6),
	weightRatio: z.number().int().min(2).max(6),
	path: z.strictObject({ a: pointSchema, b: pointSchema }),
})

export type KeyVisualLineInput = z.infer<typeof keyVisualLineInputSchema>

function resolveOption<Id extends string>(
	value: ControllerControlValue,
	allowed: readonly Id[],
	fallback: Id,
): Id {
	return typeof value === 'string' && (allowed as readonly string[]).includes(value)
		? (value as Id)
		: fallback
}

function toPoint(value: ControllerPadValue) {
	return { x: (value.x + 1) / 2, y: (value.y + 1) / 2 }
}

function toPath(value: ControllerValues[string]) {
	if (!isControllerPadPairValue(value)) return KEY_VISUAL_LINE_DEFAULT_INPUT.path
	return { a: toPoint(value.a), b: toPoint(value.b) }
}

/** Controller primitive 값(-1~1)을 Key Visual 2D Line 입력(0~1)으로 바꾸고 검증한다. */
export function toKeyVisualLineInput(values: ControllerValues): KeyVisualLineInput {
	return keyVisualLineInputSchema.parse({
		colorway: resolveOption(
			values.colorway,
			colorwayIds,
			KEY_VISUAL_LINE_DEFAULT_INPUT.colorway,
		),
		lineCount: values.lineCount,
		angleStart: values.angleStart,
		angleSpread: values.angleSpread,
		lengthStart: values.lengthStart,
		lengthEnd: values.lengthEnd,
		weightThin: values.weightThin,
		weightRatio: values.weightRatio,
		path: toPath(values.path),
	})
}

export type KeyVisualLineSegment = {
	x1: number
	y1: number
	x2: number
	y2: number
	weight: number
}

export type KeyVisualLineScene = {
	width: number
	height: number
	backgroundColor: string
	lineColor: string
	startPoint: { x: number; y: number }
	endPoint: { x: number; y: number }
	segments: KeyVisualLineSegment[]
}

/**
 * Start Line과 End Line 두 선분을 먼저 세우고, 사이의 선들은 **양 끝점끼리 블렌딩**해서 얻는다.
 *
 * 🔴 중심점을 옮기며 각도를 함께 돌리지 않는다 — 그렇게 하면 끝점이 원호를 그려 실루엣이
 *    볼록해진다(2026-09-11에 실제로 그랬다). 끝점을 직접 잇는 지금은 실루엣이 직선이다.
 */
export function createKeyVisualLineScene(
	input: KeyVisualLineInput,
	viewport: { width: number; height: number },
): KeyVisualLineScene {
	const colorway = KEY_VISUAL_LINE_COLORWAYS[input.colorway]
	const scale = Math.min(viewport.width, viewport.height) / KEY_VISUAL_LINE_REFERENCE_BASE
	const startPoint = {
		x: input.path.a.x * viewport.width,
		y: input.path.a.y * viewport.height,
	}
	const endPoint = { x: input.path.b.x * viewport.width, y: input.path.b.y * viewport.height }
	const first = endpointsOf(startPoint, input.angleStart, input.lengthStart * scale)
	const last = endpointsOf(
		endPoint,
		input.angleStart + input.angleSpread,
		input.lengthEnd * scale,
	)
	const segments: KeyVisualLineSegment[] = []

	for (let index = 0; index < input.lineCount; index++) {
		const progress = input.lineCount > 1 ? index / (input.lineCount - 1) : 0
		segments.push({
			x1: lerp(first.x1, last.x1, progress),
			y1: lerp(first.y1, last.y1, progress),
			x2: lerp(first.x2, last.x2, progress),
			y2: lerp(first.y2, last.y2, progress),
			// ponytail: 두께는 선마다 균일하다. 한 선 안에서 테이퍼가 필요해지면 line이 아니라 polygon으로.
			weight: lerp(input.weightThin * input.weightRatio, input.weightThin, progress) * scale,
		})
	}

	return {
		width: viewport.width,
		height: viewport.height,
		backgroundColor: colorway.background,
		lineColor: colorway.line,
		startPoint,
		endPoint,
		segments,
	}
}

/** 중심·각도·길이로 선분 하나의 양 끝점을 낸다 — 블렌딩의 재료다. */
function endpointsOf(center: { x: number; y: number }, angleDegrees: number, length: number) {
	const angle = toRadians(angleDegrees)
	const halfX = (Math.cos(angle) * length) / 2
	const halfY = (Math.sin(angle) * length) / 2
	return {
		x1: center.x - halfX,
		y1: center.y - halfY,
		x2: center.x + halfX,
		y2: center.y + halfY,
	}
}

function lerp(start: number, end: number, progress: number) {
	return start + (end - start) * progress
}

function toRadians(degrees: number) {
	return (degrees * Math.PI) / 180
}

export function createKeyVisualLineVectorArtifact(scene: KeyVisualLineScene): VectorSceneArtifact {
	return {
		kind: 'vector',
		source: {
			width: scene.width,
			height: scene.height,
			background: scene.backgroundColor,
			primitives: scene.segments.map((segment) => ({
				kind: 'line' as const,
				x1: segment.x1,
				y1: segment.y1,
				x2: segment.x2,
				y2: segment.y2,
				stroke: scene.lineColor,
				strokeWidth: segment.weight,
				lineCap: 'square' as const,
			})),
		},
	}
}

const model = {
	createVectorArtifact: (values, viewport) =>
		createKeyVisualLineVectorArtifact(
			createKeyVisualLineScene(toKeyVisualLineInput(values), viewport),
		),
	getBindings: (viewport): ControllerRuntimeBindings =>
		viewport.width > 0 && viewport.height > 0
			? { path: { padAspectRatio: viewport.width / viewport.height } }
			: {},
} satisfies GraphicModelAdapter

export default model
