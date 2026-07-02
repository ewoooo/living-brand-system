import {
	listPublishedTemplateNavItems,
	listTemplateCategories,
} from '../repositories/published-template.payload.repository'

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
 */
export async function getCreateNavigation(): Promise<GetCreateNavigationOutput> {
	try {
		const [categories, templates] = await Promise.all([
			listTemplateCategories(),
			listPublishedTemplateNavItems(),
		])

		return {
			categories: categories.map((category) => ({
				id: category.id,
				title: category.title,
				slug: category.slug,
				href: `/create/${category.slug}`,
				templates: templates
					.filter((template) => template.category === category.id)
					.map((template) => ({
						id: template.id,
						name: template.name,
						href: `/create/${category.slug}/${template.id}`,
					})),
			})),
		}
	} catch {
		return { categories: [] }
	}
}
