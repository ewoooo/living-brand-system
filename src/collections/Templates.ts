import { APIError, type CollectionConfig, type Payload } from 'payload'
import {
	type AuthorizedImageRef,
	validateTemplateImages,
} from '@/features/template-import/services/validate-authorized-assets'
import { authenticated, managerOrAdmin } from '@/lib/auth'
import { AUTHORIZED_ASSET_COLLECTIONS } from '@/types/json-template'

export const Templates: CollectionConfig = {
	slug: 'templates',
	access: {
		// 누구나 읽되(인증), 자원 변경은 manager/admin만 (Worker는 사용만)
		read: authenticated,
		create: managerOrAdmin,
		update: managerOrAdmin,
		delete: managerOrAdmin,
	},
	hooks: {
		// 보안/브랜드 통제: 이미지·벡터는 인가된 내부 에셋만 허용한다.
		// 임포트 조각(template-assets)이 남아 있으면 draft를 포함해 어떤 저장도 거부한다 (docs/07).
		beforeChange: [
			async ({ data, req }) => {
				const validation = validateTemplateImages(data?.jsonTemplate)

				// 보안 게이트는 fail-closed — 검사할 수 없는 값은 저장하지 않는다.
				if (validation.status === 'invalid') {
					throw new APIError(
						'jsonTemplate이 스키마(src/types/json-template.ts)와 맞지 않아 저장할 수 없습니다.',
						400,
					)
				}
				if (validation.unauthorizedLabels.length > 0) {
					throw new APIError(
						`인가된 에셋으로 교체되지 않은 이미지가 있습니다: ${validation.unauthorizedLabels.join(', ')}. 미리보기에서 각 이미지를 브랜드 에셋으로 교체한 뒤 저장하세요.`,
						400,
					)
				}

				// 인가 컬렉션은 자기신고 라벨이 아니라 실제 문서 참조로 검증한다.
				const invalidRefLabels = await findInvalidAuthorizedRefs(
					req.payload,
					validation.authorizedRefs,
				)

				if (invalidRefLabels.length > 0) {
					throw new APIError(
						`인가 에셋 참조가 유효하지 않습니다: ${invalidRefLabels.join(', ')}. 미리보기에서 에셋을 다시 선택하세요.`,
						400,
					)
				}

				return data
			},
		],
	},
	labels: {
		singular: 'Template',
		plural: 'Templates',
	},
	admin: {
		group: 'Production Resources',
		useAsTitle: 'name',
		defaultColumns: ['name', 'sourceType', 'updatedAt'],
	},
	versions: {
		drafts: {
			schedulePublish: true,
		},
		maxPerDoc: 50,
	},
	fields: [
		{
			name: 'name',
			type: 'text',
			required: true,
			localized: true,
		},
		{
			name: 'description',
			type: 'textarea',
			localized: true,
		},
		{
			name: 'sourceType',
			type: 'select',
			required: true,
			options: [
				{ label: 'Figma', value: 'figma' },
				{ label: 'File', value: 'file' },
			],
		},
		{
			name: 'figmaImport',
			type: 'ui',
			admin: {
				condition: (data) => data?.sourceType === 'figma',
				components: {
					Field: '/features/template-import/components/figma-import-field',
				},
			},
		},
		{
			name: 'templatePreview',
			type: 'ui',
			admin: {
				components: {
					Field: '/features/template-import/components/template-preview-field',
				},
			},
		},
		{
			name: 'jsonTemplate',
			type: 'json',
			admin: {
				description:
					'렌더 계약(JsonTemplate). 임포트가 생성하며, 수정 시 src/types/json-template.ts 스키마를 지켜야 합니다.',
			},
		},
		{
			name: 'category',
			type: 'relationship',
			relationTo: 'template-categories',
			required: true,
			index: true,
			admin: {
				position: 'sidebar',
				description: 'Create 화면 사이드바에서 이 템플릿이 속할 카테고리입니다.',
			},
		},
		{
			name: 'sourceUrl',
			type: 'text',
			admin: {
				position: 'sidebar',
				description:
					'임포트에 사용한 Figma URL 원문입니다. 출처 기록용이며 재동기화하지 않습니다.',
			},
		},
	],
}

/** 자기신고된 인가 참조가 실제 해당 컬렉션 문서를 가리키고 src도 그 문서의 URL인지 확인한다. */
async function findInvalidAuthorizedRefs(
	payload: Payload,
	refs: AuthorizedImageRef[],
): Promise<string[]> {
	const invalidLabels: string[] = []

	for (const collection of AUTHORIZED_ASSET_COLLECTIONS) {
		const collectionRefs = refs.filter((ref) => ref.collection === collection)

		if (collectionRefs.length === 0) {
			continue
		}

		const found = await payload.find({
			collection,
			depth: 0,
			limit: collectionRefs.length,
			overrideAccess: true,
			where: { id: { in: collectionRefs.map((ref) => ref.assetId) } },
		})
		const docsById = new Map<number, { url?: string | null }>(
			(found.docs as { id: number; url?: string | null }[]).map((doc) => [doc.id, doc]),
		)

		for (const ref of collectionRefs) {
			const doc = docsById.get(ref.assetId)
			const srcMatches =
				doc != null && (ref.src === doc.url || ref.src.startsWith(`/api/${collection}/`))

			if (!srcMatches) {
				invalidLabels.push(ref.label)
			}
		}
	}

	return invalidLabels
}
