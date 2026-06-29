import config from '@payload-config'
import { getPayload } from 'payload'

export interface GetGuidelineNavigationOutput {
	title: string
	sections: {
		id: number
		title: string
		pages: {
			id: number
			title: string
			href: string
		}[]
	}[]
}

/**
 * Creator UI 사이드바는 발행된 가이드라인의 목차 정보만 읽는다.
 * 본문 렌더링은 page/section service가 담당한다.
 */
export async function getGuidelineNavigation(): Promise<GetGuidelineNavigationOutput> {
	try {
		const payload = await getPayload({ config })
		const [guideline, sections, pages] = await Promise.all([
			payload.findGlobal({
				slug: 'guideline',
				depth: 0,
				locale: 'ko',
				fallbackLocale: 'en',
				draft: false,
				select: {
					name: true,
				},
			}),
			payload.find({
				collection: 'sections',
				sort: 'displayOrder',
				limit: 100,
				locale: 'ko',
				fallbackLocale: 'en',
				draft: false,
				select: {
					title: true,
					slug: true,
				},
			}),
			payload.find({
				collection: 'guideline-pages',
				depth: 0,
				sort: 'displayOrder',
				limit: 500,
				locale: 'ko',
				fallbackLocale: 'en',
				draft: false,
				select: {
					title: true,
					slug: true,
					section: true,
				},
			}),
		])

		return {
			title: guideline.name,
			// ponytail: sidebar lists are tiny; index pages if this grows.
			sections: sections.docs.map((section) => ({
				id: section.id,
				title: section.title,
				pages: pages.docs
					.filter((page) => page.section === section.id)
					.map((page) => ({
						id: page.id,
						title: page.title,
						href: `/guideline/${section.slug}/${page.slug}`,
					})),
			})),
		}
	} catch {
		return {
			title: 'Hyundai Brand Guideline',
			sections: [],
		}
	}
}
