import { projectTemplateRenderModel } from '@/features/template-core/domain/project-template-render-model'
import {
	listPublishedTemplateNavItems,
	listTemplateCategories,
} from '@/features/template-core/repositories/published-template.payload.repository'
import { getStudioTemplateCategoryRoute, getStudioTemplateRoute } from '@/lib/routes'

export interface GetCreateNavigationOutput {
	categories: {
		id: number
		title: string
		slug: string
		href: string
		templates: {
			id: number
			name: string
			href: string
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
		categories: categories.map((category) => ({
			id: category.id,
			title: category.title,
			slug: category.slug,
			href: getStudioTemplateCategoryRoute(category.slug),
			templates: availableTemplates
				.filter((template) => template.category === category.id)
				.map((template) => ({
					id: template.id,
					name: template.name,
					href: getStudioTemplateRoute(category.slug, template.id),
				})),
		})),
	}
}
