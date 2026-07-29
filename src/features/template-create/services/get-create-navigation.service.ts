import { cache } from 'react'
import { getStudioTemplateCategoryRoute, getStudioTemplateRoute } from '@/lib/routes'
import {
	listPublishedTemplateNavItems,
	listTemplateCategories,
} from '@/repositories/published-template.payload.repository'

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
 * Create 화면 사이드바용 카테고리 → published 템플릿 목차 read service.
 * guideline의 섹션 → 페이지 내비게이션과 같은 관계를 만든다.
 * Payload 조회는 published-template repository가 소유한다.
 * layout과 페이지가 같은 요청에서 함께 호출하므로 cache()로 요청당 한 번만 조회한다.
 */
export const getCreateNavigation = cache(async (): Promise<GetCreateNavigationOutput> => {
	const [categories, templates] = await Promise.all([
		listTemplateCategories(),
		listPublishedTemplateNavItems(),
	])

	return {
		categories: categories.map((category) => ({
			id: category.id,
			title: category.title,
			slug: category.slug,
			href: getStudioTemplateCategoryRoute(category.slug),
			templates: templates
				.filter((template) => template.category === category.id)
				.map((template) => ({
					id: template.id,
					name: template.name,
					href: getStudioTemplateRoute(category.slug, template.id),
				})),
		})),
	}
})
