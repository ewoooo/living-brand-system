import { defineGraphicRuntime } from '@/features/graphic-generation/graphic-runtimes/define-graphic-runtime'
import { KEY_VISUAL_LINE_COLORWAYS } from '@/features/graphic-generation/graphic-runtimes/key-visual-line/definition'
import type { ControllerControlDefinition } from '@/modules/studio-controller/controller-definition'

/** 면이 놓이는 변. 선은 그 반대쪽으로 뻗어 나간다. */
export const KEY_VISUAL_FORMATION_ANCHORS = {
	top: { label: '위', axis: 'vertical' },
	bottom: { label: '아래', axis: 'vertical' },
	left: { label: '왼쪽', axis: 'horizontal' },
	right: { label: '오른쪽', axis: 'horizontal' },
} as const
export type KeyVisualFormationAnchorId = keyof typeof KEY_VISUAL_FORMATION_ANCHORS

/**
 * 가이드라인 B.8 TYPE C — FORMATION의 기본값.
 *
 * 면 하나가 한쪽 변을 채우고, 반대쪽으로 가면서 선이 점점 얇아진다.
 * 🔴 두 수치는 가이드라인 규정이라 컨트롤 범위가 곧 규정이다 — 면 비율 1:1 이상 · 단계 6 이상.
 */
export const KEY_VISUAL_FORMATION_DEFAULT_INPUT = {
	colorway: 'darkGreenGreen',
	anchor: 'top',
	planeRatio: 0.5,
	steps: 8,
	decay: 2,
} as const

type RangeControl = Extract<ControllerControlDefinition, { kind: 'range' }>

function rangeControl(
	id: string,
	label: string,
	defaultValue: number,
	min: number,
	max: number,
	step = 1,
	display: RangeControl['display'] = { precision: 0 },
): RangeControl {
	return { id, kind: 'range', label, defaultValue, min, max, step, display }
}

export default defineGraphicRuntime({
	studio: 'graphic',
	id: 'key-visual-formation',
	version: 1,
	name: 'Key Visual Formation',
	type: 'p5',
	artifacts: { vector: {}, raster: {} },
	controller: {
		// 면이 어느 변에 붙는가가 이 런타임의 형태 축이다.
		left: ['anchor', 'colorway'],
		right: ['planeRatio', 'steps', 'decay'],
		groups: [
			{
				id: 'graphic',
				title: 'Graphic',
				controls: [
					{
						id: 'anchor',
						kind: 'select' as const,
						label: '면의 자리',
						variant: 'segmented' as const,
						defaultValue: KEY_VISUAL_FORMATION_DEFAULT_INPUT.anchor,
						options: Object.entries(KEY_VISUAL_FORMATION_ANCHORS).map(
							([value, anchor]) => ({ value, label: anchor.label }),
						),
					},
					{
						id: 'colorway',
						kind: 'select' as const,
						label: '컬러',
						variant: 'list' as const,
						defaultValue: KEY_VISUAL_FORMATION_DEFAULT_INPUT.colorway,
						// 고르는 것이 색 하나가 아니라 배경·선 쌍이라 선택지가 색 자체를 내놓는다.
						options: Object.entries(KEY_VISUAL_LINE_COLORWAYS).map(
							([value, colorway]) => ({
								value,
								label: colorway.label,
								colors: [colorway.background, colorway.line],
							}),
						),
					},
				],
			},
			{
				id: 'formation',
				title: 'Formation',
				controls: [
					// 하한 0.5 — 면의 영역은 선의 영역보다 좁을 수 없다(최소 1:1).
					rangeControl(
						'planeRatio',
						'면 비율',
						KEY_VISUAL_FORMATION_DEFAULT_INPUT.planeRatio,
						0.5,
						0.9,
						0.01,
						{ precision: 2 },
					),
					// 하한 6 — 면에서 선으로 이어지는 단계는 6단계 이상이어야 한다.
					rangeControl('steps', '단계', KEY_VISUAL_FORMATION_DEFAULT_INPUT.steps, 6, 20),
					rangeControl(
						'decay',
						'가늘어지는 정도',
						KEY_VISUAL_FORMATION_DEFAULT_INPUT.decay,
						1,
						4,
						0.1,
						{ precision: 1 },
					),
				],
			},
		],
	},
})
