import type { GuidelinePage } from '@/payload-types'
import {
	findPublishedSectionBySlug,
	listPublishedPagesBySection,
} from '../repositories/guideline-view.payload.repository'

export interface GetGuidelineSectionOutput {
	title: string
	description: string | null
	pages: {
		id: number
		title: string
		slug: string
		description: GuidelinePage['description']
		displayOrder: number
		blocks: GuidelinePage['blocks']
	}[]
}

/**
 * Creator UI는 발행된 섹션과 하위 페이지만 읽는다.
 * 페이지는 섹션 화면에서 한 번에 렌더하므로 page service를 반복 호출하지 않는다.
 */
export async function getGuidelineSection(
	sectionSlug: string,
): Promise<GetGuidelineSectionOutput | null> {
	try {
		const section = await findPublishedSectionBySlug(sectionSlug)

		if (!section) {
			return null
		}

		const pages = await listPublishedPagesBySection(section.id)

		return {
			title: section.title,
			description: section.description || null,
			pages: pages.map((page) => ({
				id: page.id,
				title: page.title,
				slug: page.slug,
				description: page.description || null,
				displayOrder: page.displayOrder,
				blocks: page.blocks || [],
			})),
		}
	} catch {
		return null
	}
}
