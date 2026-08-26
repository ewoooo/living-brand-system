import {
	findPublishedChapterBySlug,
	listPublishedTopicsByChapter,
} from '../repositories/guideline-view.payload.repository'

export interface GetGuidelineChapterOutput {
	title: string
	label: string | null
	description: string | null
	topics: {
		id: number
		title: string
		slug: string
		description: string | null
	}[]
}

/**
 * Creator UI 장 랜딩 화면은 발행된 장과 하위 토픽 목록만 읽는다.
 * 토픽 본문 렌더링은 topic service가 담당한다.
 * Payload 조회는 guideline-view repository가 소유한다.
 */
export async function getGuidelineChapter(
	chapterSlug: string,
): Promise<GetGuidelineChapterOutput | null> {
	const chapter = await findPublishedChapterBySlug(chapterSlug)

	if (!chapter) {
		return null
	}

	const topics = await listPublishedTopicsByChapter(chapter.id)

	return {
		title: chapter.title,
		label: chapter.label,
		description: chapter.description,
		topics: topics.map((topic) => ({
			id: topic.id,
			title: topic.title,
			slug: topic.slug,
			description: topic.description,
		})),
	}
}
