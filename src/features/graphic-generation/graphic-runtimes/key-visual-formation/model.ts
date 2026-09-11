import { z } from 'zod'
import type { GraphicModelAdapter } from '@/features/graphic-generation/runtime/graphic-plugin'
import type { VectorSceneArtifact } from '@/modules/studio-artifact/studio-artifact'
import type {
	ControllerControlValue,
	ControllerValues,
} from '@/modules/studio-controller/controller-definition'
import {
	KEY_VISUAL_FORMATION_ANCHORS,
	KEY_VISUAL_FORMATION_COLORWAYS,
	KEY_VISUAL_FORMATION_DEFAULT_INPUT,
	KEY_VISUAL_FORMATION_MIN_LINE_WEIGHT,
	type KeyVisualFormationAnchorId,
	type KeyVisualFormationColorwayId,
} from './definition'

export { KEY_VISUAL_FORMATION_DEFAULT_INPUT } from './definition'

const colorwayIds = Object.keys(KEY_VISUAL_FORMATION_COLORWAYS) as KeyVisualFormationColorwayId[]
const anchorIds = Object.keys(KEY_VISUAL_FORMATION_ANCHORS) as KeyVisualFormationAnchorId[]

export const keyVisualFormationInputSchema = z.strictObject({
	colorway: z.enum(colorwayIds),
	anchor: z.enum(anchorIds),
	planeRatio: z.number().min(0.5).max(0.9),
	steps: z.number().int().min(6).max(20),
	decay: z.number().min(-4).max(4),
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
	fill: string
}

export type KeyVisualFormationScene = {
	width: number
	height: number
	backgroundColor: string
	/** 면 하나 + 선 여러 개. 면이 더 짙으므로 색이 다르다 — 칠할 색을 밴드가 직접 갖는다. */
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
	const colorway = KEY_VISUAL_FORMATION_COLORWAYS[input.colorway]
	const anchor = KEY_VISUAL_FORMATION_ANCHORS[input.anchor]
	const vertical = anchor.axis === 'vertical'
	const axisLength = vertical ? viewport.height : viewport.width
	const crossLength = vertical ? viewport.width : viewport.height
	const planeLength = axisLength * input.planeRatio
	const slotLength = (axisLength - planeLength) / input.steps
	// 면이 끝나는 자리에서 선이 시작한다. top·left는 정방향, bottom·right는 반대편에서 되돌아온다.
	const forward = input.anchor === 'top' || input.anchor === 'left'

	// 🔴 얇아지는 데에 바닥이 있다 — 감쇠를 세게 걸면 끝쪽 선이 머리카락처럼 남아 보기 불편하고
	//    인쇄에서는 사라진다. 부호를 뒤집어 굵어지는 방향으로 가도 반대쪽 끝에서 같은 일이 생긴다.
	/**
	 * 🔴 최소 두께는 **양쪽 모두**에 걸린다. 칸에서 칠하는 쪽이 선이고 남는 쪽이 면인데, 그 면도
	 *    눈에는 선으로 보인다 — 한쪽만 받치면 반대쪽이 머리카락처럼 남는다.
	 *    칸이 하한 두 몫보다 좁으면 반씩 나눈다.
	 */
	const minWeight = Math.min(
		slotLength / 2,
		KEY_VISUAL_FORMATION_MIN_LINE_WEIGHT * (Math.min(viewport.width, viewport.height) / 1080),
	)
	const spans = [{ start: 0, size: planeLength }]
	for (let index = 0; index < input.steps; index++) {
		// index/steps라 마지막 칸도 두께가 0이 아니다 — 「단계」가 곧 보이는 선의 개수다.
		const progress = index / input.steps
		// 면에 가까울수록 얇고 멀어질수록 굵다. 감쇠가 음수면 그 방향이 뒤집힌다.
		const falloff = input.decay >= 0 ? progress ** input.decay : (1 - progress) ** -input.decay
		spans.push({
			start: planeLength + index * slotLength,
			size: clamp(slotLength * falloff, minWeight, slotLength - minWeight),
		})
	}

	return {
		width: viewport.width,
		height: viewport.height,
		backgroundColor: colorway.plane,
		bands: spans.map(({ start, size }, index) => {
			const offset = forward ? start : axisLength - start - size
			// 첫 밴드가 면이다 — 나머지 선보다 짙게 칠한다.
			const fill = index === 0 ? colorway.plane : colorway.line
			return vertical
				? { x: 0, y: offset, width: crossLength, height: size, fill }
				: { x: offset, y: 0, width: size, height: crossLength, fill }
		}),
	}
}

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value))
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
				fill: band.fill,
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
