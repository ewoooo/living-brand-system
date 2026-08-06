import { z } from 'zod'
import {
	type AuthorizedTemplateImageRef,
	TEMPLATE_VECTOR_ASSET_COLLECTIONS,
} from '@/services/template-asset-policy.service'
import type { TemplateNodeConfigMap } from '@/types/template'

const templateSlotSpecSchema = z
	.object({
		label: z.string().optional(),
		placeholder: z.string().optional(),
		maxLength: z.number().int().positive().optional(),
		maxLines: z.number().int().positive().optional(),
		inputFormat: z.enum(['free', 'number', 'email', 'date']).optional(),
		aiInstruction: z.string().optional(),
	})
	.strict()

// 자유 편집 값의 신뢰 경계 — 유한수 + 상식적 범위 밖은 저장을 거부한다(클램프하지 않음).
const templateImageTransformSchema = z
	.object({
		x: z.number().finite().min(-10000).max(10000),
		y: z.number().finite().min(-10000).max(10000),
		scale: z.number().finite().gt(0).max(20),
		rotate: z.number().finite().min(-360).max(360),
	})
	.strict()

// 컬러 치환 값의 신뢰 경계 — CSS로 그대로 나가는 값이므로 hex 리터럴만 허용한다.
const templateHexColorSchema = z.string().regex(/^#[0-9a-fA-F]{3,8}$/)
const templateImageColorizeSchema = z
	.object({
		line: templateHexColorSchema,
		background: templateHexColorSchema,
	})
	.strict()

const templateNodeConfigMapSchema = z.record(
	z.string().min(1),
	z
		.object({
			text: z.string().optional(),
			backgroundImage: z.string().optional(),
			generatedImageId: z.number().int().positive().optional(),
			imageTransform: templateImageTransformSchema.optional(),
			imageColorize: templateImageColorizeSchema.optional(),
			input: templateSlotSpecSchema.optional(),
			imageInput: z
				.object({ profileId: z.number().int().positive().optional() })
				.strict()
				.optional(),
			vectorAsset: z
				.object({
					collection: z.enum(TEMPLATE_VECTOR_ASSET_COLLECTIONS),
					id: z.number().int().positive(),
					src: z.string().min(1),
				})
				.strict()
				.optional(),
			vectorFit: z.enum(['fill', 'contain']).optional(),
			vectorColor: z.string().optional(),
		})
		.strict(),
)

/** DB overrides를 공용 node config 계약으로 검증하고 노드별 에셋 참조를 만든다. */
export function parseTemplateNodeConfigs(value: unknown):
	| { blocker: string }
	| {
			data: TemplateNodeConfigMap
			refsByNode: Map<string, AuthorizedTemplateImageRef>
	  } {
	const parsed = templateNodeConfigMapSchema.safeParse(value ?? {})
	if (!parsed.success) {
		return { blocker: 'HTML 템플릿의 overrides 형식이 올바르지 않습니다.' }
	}

	const refsByNode = new Map<string, AuthorizedTemplateImageRef>()
	for (const [nodeId, config] of Object.entries(parsed.data)) {
		if (config.generatedImageId) {
			if (!config.backgroundImage?.trim() || config.vectorAsset) {
				return { blocker: 'HTML 템플릿의 생성 이미지 참조가 올바르지 않습니다.' }
			}
			refsByNode.set(nodeId, {
				collection: 'generated-images',
				assetId: config.generatedImageId,
				src: config.backgroundImage,
				label: nodeId,
			})
			continue
		}
		if (config.vectorAsset) {
			refsByNode.set(nodeId, {
				collection: config.vectorAsset.collection,
				assetId: config.vectorAsset.id,
				src: config.vectorAsset.src,
				label: nodeId,
			})
		}
	}

	return { data: parsed.data as TemplateNodeConfigMap, refsByNode }
}
