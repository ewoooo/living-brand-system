import { projectTemplateRenderModel } from '@/features/template-core/domain/project-template-render-model'
import {
	listPublishedTemplateNavItems,
	listTemplateCategories,
} from '@/features/template-core/repositories/published-template.payload.repository'
import { getStudioTemplateRoute } from '@/lib/routes'
import {
	type StudioPreviewImage,
	toStudioPreviewImage,
} from '@/modules/studio-controller/controller-definition'

export interface GetCreateNavigationOutput {
	categories: {
		id: number
		title: string
		slug: string
		templates: {
			id: number
			name: string
			slug: string
			href: string
			previewImage?: StudioPreviewImage
		}[]
	}[]
}

/** Payload 관계 값에서 id만 꺼낸다 — depth 0이면 값 자체가 id고, populate되면 문서의 id다. */
function toRelationshipId(value: unknown): number | undefined {
	if (typeof value === 'number') return value
	if (value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'number') {
		return (value as { id: number }).id
	}
	return undefined
}

/**
 * Create 화면 선택기용 카테고리 → 렌더 가능한 published 템플릿 read service.
 * Payload 조회는 published-template repository가 소유한다.
 */
export async function getCreateNavigation(): Promise<GetCreateNavigationOutput> {
	const [categories, templates] = await Promise.all([
		listTemplateCategories(),
		listPublishedTemplateNavItems(),
	])
	const availableTemplates = templates.filter((template) => projectTemplateRenderModel(template))

	return {
		// 카테고리는 목록을 묶는 분류일 뿐이다 — 주소는 템플릿 slug 하나로 정해진다(카테고리 세그먼트 없음).
		categories: categories.map((category) => ({
			id: category.id,
			title: category.title,
			slug: category.slug,
			templates: availableTemplates
				// 🔴 depth에 따라 관계는 id로도, populate된 문서로도 온다(미리보기 이미지 때문에
				// 이 조회는 depth 1이다). id로만 비교하면 모든 카테고리가 조용히 비어버린다.
				.filter((template) => toRelationshipId(template.category) === category.id)
				.map((template) => ({
					id: template.id,
					name: template.name,
					slug: template.slug,
					href: getStudioTemplateRoute(template.slug),
					previewImage: toStudioPreviewImage(template.previewImage),
				})),
		})),
	}
}
