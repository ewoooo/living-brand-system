import config from '@payload-config'
import { getPayload } from 'payload'
import type { GuidelinePage } from '@/payload-types'

export interface GetGuidelineSectionInput {
	sectionSlug: string
}

export interface GetGuidelineSectionOutput {
	title: string
	description: string | null
	pages: {
		id: number
		title: string
		slug: string
		displayOrder: number
		policyBody: NonNullable<GuidelinePage['policy']>['body'] | null
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
					body: true,
				},
			},
		})

		return {
			title: section.title,
			description: section.description || null,
			pages: pages.docs.map((page) => ({
				id: page.id,
				title: page.title,
				slug: page.slug,
				displayOrder: page.displayOrder,
				policyBody: page.policy?.body || null,
			})),
		}
	} catch {
		return null
	}
}
