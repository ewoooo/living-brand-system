import {
	findPublishedChapterBySlug,
	listPublishedSectionsByChapter,
} from '../repositories/guideline-view.payload.repository'
import { extractTextFromLexical } from '../utils/lexical-text'

export interface GetGuidelineChapterOutput {
	title: string
	label: string | null
	description: string | null
	sections: {
		id: number
		title: string
		slug: string
		description: string | null
	}[]
}

/**
 * Creator UI 장 랜딩 화면은 발행된 장과 하위 섹션 목록만 읽는다.
 * 섹션 본문 렌더링은 section service가 담당한다.
 * Payload 조회는 guideline-view repository가 소유한다.
 */
export async function getGuidelineChapter(
	chapterSlug: string,
): Promise<GetGuidelineChapterOutput | null> {
	const chapter = await findPublishedChapterBySlug(chapterSlug)

	if (!chapter) {
		return null
	}

	const sections = await listPublishedSectionsByChapter(chapter.id)

	return {
		title: chapter.title,
		label: chapter.label || null,
		description: extractTextFromLexical(chapter.description) || null,
		sections: sections.map((section) => ({
			id: section.id,
			title: section.title,
			slug: section.slug,
			description: extractTextFromLexical(section.description) || null,
		})),
	}
}
