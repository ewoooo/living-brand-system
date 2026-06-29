import config from '@payload-config'
import { getPayload } from 'payload'

export interface GetGuidelinePageInput {
	sectionSlug: string
	pageSlug: string
}

export interface GetGuidelinePageOutput {
	title: string
	sectionTitle: string
}

/**
 * Creator UI는 발행된 가이드라인 페이지만 읽는다.
 * draft 페이지는 화면과 Agent 기준으로 사용하지 않는다.
 */
export async function getGuidelinePage({
	sectionSlug,
	pageSlug,
}: GetGuidelinePageInput): Promise<GetGuidelinePageOutput | null> {
	if (!sectionSlug || !pageSlug) {
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
			},
		})
		const section = sections.docs[0]

		if (!section) {
			return null
		}

		const pages = await payload.find({
			collection: 'guideline-pages',
			where: {
				and: [
					{
						slug: {
							equals: pageSlug,
						},
					},
					{
						section: {
							equals: section.id,
						},
					},
				],
			},
			limit: 1,
			locale: 'ko',
			fallbackLocale: 'en',
			draft: false,
			select: {
				title: true,
			},
		})
		const page = pages.docs[0]

		if (!page) {
			return null
		}

		return {
			title: page.title,
			sectionTitle: section.title,
		}
	} catch {
		return null
	}
}
