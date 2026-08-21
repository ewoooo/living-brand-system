import { z } from 'zod'

/**
 * 배경 위에 얹힌 오버레이(CI·글자)의 가독성 룰 options.
 * 배경 이미지는 통제 대상이 아니고, 그 위 오버레이가 읽히는지만 규정한다.
 */

const HEX = /^#[0-9a-fA-F]{6}$/

const overlayLegibilityCriterionSchema = z.strictObject({
	measurement: z.enum(['minContrastRatio', 'p05ContrastRatio', 'p50ContrastRatio']),
	operator: z.literal('gte'),
	expected: z.number().min(1).max(21),
})

export const overlayLegibilityOptionsSchema = z.strictObject({
	parameters: z
		.strictObject({
			/** 오버레이로 인정할 평면 색 목록. 비우면 흰색·검정. */
			overlayColors: z.array(z.string().regex(HEX)).min(1).max(8).optional(),
			/** 이 RGB 거리 안이면 그 오버레이 색으로 본다. */
			colorTolerance: z.number().min(0).max(64).optional(),
			/** 이웃과 이만큼 이내면 「평탄」 — 벡터 오버레이와 사진을 가르는 값. */
			flatTolerance: z.number().min(0).max(32).optional(),
		})
		.optional(),
	criteria: z.array(overlayLegibilityCriterionSchema).min(1).max(3),
})

export type OverlayLegibilityOptions = z.infer<typeof overlayLegibilityOptionsSchema>
