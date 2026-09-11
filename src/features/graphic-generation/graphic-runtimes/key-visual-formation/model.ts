import { z } from 'zod'
import { KEY_VISUAL_LINE_COLORWAYS } from '@/features/graphic-generation/graphic-runtimes/key-visual-line/definition'
import type { GraphicModelAdapter } from '@/features/graphic-generation/runtime/graphic-plugin'
import type { VectorSceneArtifact } from '@/modules/studio-artifact/studio-artifact'
import type {
	ControllerControlValue,
	ControllerValues,
} from '@/modules/studio-controller/controller-definition'
import {
	KEY_VISUAL_FORMATION_ANCHORS,
	KEY_VISUAL_FORMATION_DEFAULT_INPUT,
	type KeyVisualFormationAnchorId,
} from './definition'

export { KEY_VISUAL_FORMATION_DEFAULT_INPUT } from './definition'

const colorwayIds = Object.keys(
	KEY_VISUAL_LINE_COLORWAYS,
) as (keyof typeof KEY_VISUAL_LINE_COLORWAYS)[]
const anchorIds = Object.keys(KEY_VISUAL_FORMATION_ANCHORS) as KeyVisualFormationAnchorId[]

export const keyVisualFormationInputSchema = z.strictObject({
	colorway: z.enum(colorwayIds),
	anchor: z.enum(anchorIds),
	planeRatio: z.number().min(0.5).max(0.9),
	steps: z.number().int().min(6).max(20),
	decay: z.number().min(1).max(4),
})

export type KeyVisualFormationInput = z.infer<typeof keyVisualFormationInputSchema>

function resolveOption<Id extends string>(
	value: ControllerControlValue,
	allowed: readonly Id[],
	fallback: Id,
): Id {
	return typeof value === 'string' && (allowed as readonly string[]).includes(value)
		? (value as Id)
		: fallback
}

export function toKeyVisualFormationInput(values: ControllerValues): KeyVisualFormationInput {
	const base = KEY_VISUAL_FORMATION_DEFAULT_INPUT
	return keyVisualFormationInputSchema.parse({
		colorway: resolveOption(values.colorway, colorwayIds, base.colorway),
		anchor: resolveOption(values.anchor, anchorIds, base.anchor),
		planeRatio: values.planeRatio,
		steps: values.steps,
		decay: values.decay,
	})
}

export type KeyVisualFormationBand = {
	x: number
	y: number
	width: number
	height: number
}

export type KeyVisualFormationScene = {
	width: number
	height: number
	backgroundColor: string
	fillColor: string
	/** 면 하나 + 선 여러 개. 둘 다 같은 색으로 칠하는 사각형이라 한 목록에 둔다. */
	bands: KeyVisualFormationBand[]
}

/**
 * 면이 놓인 변에서 반대쪽으로 가며 선이 얇아진다.
 *
 * 🔑 칸을 먼저 균등하게 나누고 그 안에서 두께만 줄인다 — 두께를 줄이면 남는 자리가 곧 간격이 되므로
 *    "선이 얇아진다"와 "간격이 벌어진다"를 따로 조절할 필요가 없다.
 */
export function createKeyVisualFormationScene(
	input: KeyVisualFormationInput,
	viewport: { width: number; height: number },
): KeyVisualFormationScene {
	const colorway = KEY_VISUAL_LINE_COLORWAYS[input.colorway]
	const anchor = KEY_VISUAL_FORMATION_ANCHORS[input.anchor]
	const vertical = anchor.axis === 'vertical'
	const axisLength = vertical ? viewport.height : viewport.width
	const crossLength = vertical ? viewport.width : viewport.height
	const planeLength = axisLength * input.planeRatio
	const slotLength = (axisLength - planeLength) / input.steps
	// 면이 끝나는 자리에서 선이 시작한다. top·left는 정방향, bottom·right는 반대편에서 되돌아온다.
	const forward = input.anchor === 'top' || input.anchor === 'left'

	const spans = [{ start: 0, size: planeLength }]
	for (let index = 0; index < input.steps; index++) {
		// index/steps라 마지막 칸도 두께가 0이 아니다 — 「단계」가 곧 보이는 선의 개수다.
		const progress = index / input.steps
		const thickness = slotLength * (1 - progress) ** input.decay
		if (thickness <= 0) continue
		spans.push({ start: planeLength + index * slotLength, size: thickness })
	}

	return {
		width: viewport.width,
		height: viewport.height,
		backgroundColor: colorway.background,
		fillColor: colorway.line,
		bands: spans.map(({ start, size }) => {
			const offset = forward ? start : axisLength - start - size
			return vertical
				? { x: 0, y: offset, width: crossLength, height: size }
				: { x: offset, y: 0, width: size, height: crossLength }
		}),
	}
}

export function createKeyVisualFormationVectorArtifact(
	scene: KeyVisualFormationScene,
): VectorSceneArtifact {
	return {
		kind: 'vector',
		source: {
			width: scene.width,
			height: scene.height,
			background: scene.backgroundColor,
			primitives: scene.bands.map((band) => ({
				kind: 'rect' as const,
				x: band.x,
				y: band.y,
				width: band.width,
				height: band.height,
				fill: scene.fillColor,
			})),
		},
	}
}

const model = {
	createVectorArtifact: (values, viewport) =>
		createKeyVisualFormationVectorArtifact(
			createKeyVisualFormationScene(toKeyVisualFormationInput(values), viewport),
		),
} satisfies GraphicModelAdapter

export default model
