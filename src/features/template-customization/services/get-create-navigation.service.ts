import { projectTemplateRenderModel } from '@/features/template-core/domain/project-template-render-model'
import {
	listPublishedTemplateNavItems,
	listTemplateCategories,
} from '@/features/template-core/repositories/published-template.payload.repository'
import { getStudioTemplateRoute } from '@/lib/routes'
import type { StudioPreviewImage } from '@/modules/studio-controller/controller-definition'

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
			// 관계는 저장소가 이미 id로 좁혀 준다 — 여기서 depth를 신경 쓸 일이 없다.
			templates: availableTemplates
				.filter((template) => template.categoryId === category.id)
				.map((template) => ({
					id: template.id,
					name: template.name,
					slug: template.slug,
					href: getStudioTemplateRoute(template.slug),
					previewImage: template.previewImage,
				})),
		})),
	}
}
