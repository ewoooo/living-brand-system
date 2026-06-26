import config from '@payload-config'
import { getPayload } from 'payload'

export interface GetGuidelineSectionInput {
	sectionSlug: string
}

export interface GetGuidelineSectionOutput {
	id: number
	slug: string
	title: string
	description: string | null
	pages: {
		id: number
		slug: string
		title: string
		displayOrder: number
		policyTitle: string | null
	}[]
}

/**
 * Creator UI는 발행된 섹션과 하위 페이지만 읽는다.
 * 페이지는 섹션 화면에서 한 번에 렌더하므로 page service를 반복 호출하지 않는다.
 */
export async function getGuidelineSection({
	sectionSlug,
}: GetGuidelineSectionInput): Promise<GetGuidelineSectionOutput | null> {
	if (!sectionSlug) {
		return null
	}

	const payload = await getPayload({ config })

	try {
		const sections = await payload.find({
			collection: 'sections',
			where: {
				slug: {
					equals: sectionSlug,
				},
			},
			limit: 1,
			locale: 'ko',
			fallbackLocale: 'en',
			draft: false,
			select: {
				title: true,
				slug: true,
				description: true,
			},
		})
		const section = sections.docs[0]

		if (!section) {
			return null
		}

		const pages = await payload.find({
			collection: 'guideline-pages',
			where: {
				section: {
					equals: section.id,
				},
			},
			sort: 'displayOrder',
			limit: 100,
			locale: 'ko',
			fallbackLocale: 'en',
			draft: false,
			select: {
				title: true,
				slug: true,
				displayOrder: true,
				policy: {
					title: true,
				},
			},
		})

		return {
			id: section.id,
			slug: section.slug,
			title: section.title,
			description: section.description || null,
			pages: pages.docs.map((page) => ({
				id: page.id,
				slug: page.slug,
				title: page.title,
				displayOrder: page.displayOrder,
				policyTitle: page.policy?.title || null,
			})),
		}
	} catch {
		return null
	}
}
