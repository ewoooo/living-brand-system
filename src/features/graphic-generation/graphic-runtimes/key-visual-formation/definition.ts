import { defineGraphicRuntime } from '@/features/graphic-generation/graphic-runtimes/define-graphic-runtime'
import type { ControllerControlDefinition } from '@/modules/studio-controller/controller-definition'

/**
 * 색 단계. 숫자가 클수록 짙다 — 3·2·1이 p.67에서 실측한 초록 세 단계이고 0이 흰색이다.
 */
const COLOR_LEVELS = [
	{ level: 0, key: 'white', label: '화이트', hex: '#FFFFFF' },
	{ level: 1, key: 'heritage', label: '헤리티지', hex: '#00AF41' },
	{ level: 2, key: 'prosperity', label: '프로스페리티', hex: '#007332' },
	{ level: 3, key: 'deep', label: '딥', hex: '#00280A' },
] as const

/**
 * 면·선 두 색의 조합. 단계가 다른 두 색을 짝지어 **면이 언제나 더 짙은** 쌍만 남긴다.
 *
 * 🔴 한 조합은 **색 두 개뿐이다.** 면은 배경과 같은 색으로 칠하고 선만 다른 색이다 — 면은 형태가
 *    아니라 「선이 모여 메워진 자리」라서 배경에서 떠오르면 안 된다.
 * 🔑 네 단계에서 순서쌍은 12개지만 면이 더 짙은 쪽만 쓰므로 절반인 6개가 남는다.
 */
export const KEY_VISUAL_FORMATION_COLORWAYS = Object.fromEntries(
	COLOR_LEVELS.flatMap((plane) =>
		COLOR_LEVELS.filter((line) => line.level < plane.level).map((line) => [
			`${plane.key}On${line.key[0]?.toUpperCase()}${line.key.slice(1)}`,
			{ label: `${plane.label} · ${line.label}`, plane: plane.hex, line: line.hex },
		]),
	),
) as Record<string, { label: string; plane: string; line: string }>
export type KeyVisualFormationColorwayId = keyof typeof KEY_VISUAL_FORMATION_COLORWAYS

/**
 * 선이 이보다 얇아지지 않는다(기준 판 짧은 변 1080px 기준). 감쇠를 세게 걸면 끝쪽 선이 머리카락처럼
 * 남아 보기 불편해지고, 인쇄에서는 아예 사라진다.
 */
export const KEY_VISUAL_FORMATION_MIN_LINE_WEIGHT = 2

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
	colorway: 'deepOnProsperity',
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
						options: Object.entries(KEY_VISUAL_FORMATION_COLORWAYS).map(
							([value, colorway]) => ({
								value,
								label: colorway.label,
								colors: [colorway.plane, colorway.line],
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
					// 음수는 반대 방향 — 면에서 멀어질수록 굵어진다. 어느 쪽이든 최소 두께가 바닥을 받친다.
					rangeControl(
						'decay',
						'가늘어지는 정도',
						KEY_VISUAL_FORMATION_DEFAULT_INPUT.decay,
						-4,
						4,
						0.1,
						{ precision: 1 },
					),
				],
			},
		],
	},
})
