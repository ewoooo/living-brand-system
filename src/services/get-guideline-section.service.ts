import config from '@payload-config'
import { getPayload } from 'payload'

export interface GetGuidelineSectionInput {
	sectionId: string
}

export interface GetGuidelineSectionOutput {
	id: number
	title: string
	description: string | null
	pages: {
		id: number
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
	sectionId,
}: GetGuidelineSectionInput): Promise<GetGuidelineSectionOutput | null> {
	const id = Number(sectionId)

	if (!Number.isInteger(id)) {
		return null
	}

	const payload = await getPayload({ config })

	try {
		const [section, pages] = await Promise.all([
			payload.findByID({
				collection: 'sections',
				id,
				locale: 'ko',
				fallbackLocale: 'en',
				draft: false,
				select: {
					title: true,
					description: true,
				},
			}),
			payload.find({
				collection: 'guideline-pages',
				where: {
					section: {
						equals: id,
					},
				},
				sort: 'displayOrder',
				limit: 100,
				locale: 'ko',
				fallbackLocale: 'en',
				draft: false,
				select: {
					title: true,
					displayOrder: true,
					policy: {
						title: true,
					},
				},
			}),
		])

		return {
			id: section.id,
			title: section.title,
			description: section.description || null,
			pages: pages.docs.map((page) => ({
				id: page.id,
				title: page.title,
				displayOrder: page.displayOrder,
				policyTitle: page.policy?.title || null,
			})),
		}
	} catch {
		return null
	}
}
