import type { GuidelinePage, GuidelineSection } from '@/payload-types'
import {
	findPublishedChapterBySlug,
	findPublishedSectionBySlug,
	listPublishedPagesBySection,
} from '../repositories/guideline-view.payload.repository'

export interface GetGuidelineSectionOutput {
	title: string
	headerImage: GuidelineSection['headerImage']
	blocks: GuidelinePage['blocks']
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
 * Creator UI는 발행된 섹션 본문과 하위 페이지만 읽는다.
 * 섹션 슬러그는 장 안에서만 유일하므로 먼저 장으로 스코프한 뒤 섹션을 찾는다.
 * 페이지는 섹션 화면에서 한 번에 렌더하므로 page service를 반복 호출하지 않는다.
 * Payload 조회는 guideline-view repository가 소유한다.
 */
export async function getGuidelineSection(
	chapterSlug: string,
	sectionSlug: string,
): Promise<GetGuidelineSectionOutput | null> {
	try {
		const chapter = await findPublishedChapterBySlug(chapterSlug)

		if (!chapter) {
			return null
		}

		const section = await findPublishedSectionBySlug(chapter.id, sectionSlug)

		if (!section) {
			return null
		}

		const pages = await listPublishedPagesBySection(section.id)

		return {
			title: section.title,
			headerImage: section.headerImage ?? null,
			blocks: section.blocks ?? [],
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
