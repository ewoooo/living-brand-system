import config from '@payload-config'
import { getPayload } from 'payload'

import type { Section } from '@/payload-types'

export interface GetGuidelinePageInput {
	pageId: string
}

export interface GetGuidelinePageOutput {
	id: number
	title: string
	sectionTitle: string
	displayOrder: number
	policyTitle: string | null
}

/**
 * Creator UI는 발행된 가이드라인 페이지만 읽는다.
 * draft 페이지는 화면과 Agent 기준으로 사용하지 않는다.
 */
export async function getGuidelinePage({
	pageId,
}: GetGuidelinePageInput): Promise<GetGuidelinePageOutput | null> {
	const id = Number(pageId)

	if (!Number.isInteger(id)) {
		return null
	}

	const payload = await getPayload({ config })

	try {
		const page = await payload.findByID({
			collection: 'guideline-pages',
			id,
			depth: 1,
			locale: 'ko',
			fallbackLocale: 'en',
			draft: false,
			select: {
				title: true,
				section: true,
				displayOrder: true,
				policy: {
					title: true,
				},
			},
		})
		const section = page.section as number | Section

		return {
			id: page.id,
			title: page.title,
			sectionTitle: typeof section === 'object' ? section.title : '',
			displayOrder: page.displayOrder,
			policyTitle: page.policy?.title || null,
		}
	} catch {
		return null
	}
}
