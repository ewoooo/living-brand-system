import {
	findPublishedChapterBySlug,
	findPublishedTopicBySlug,
	type GuidelineBackground,
	type GuidelineBackgroundTone,
	type GuidelineBlocks,
	type GuidelineDescription,
	type GuidelineHeaderImage,
	listPublishedPagesByTopic,
} from '../repositories/guideline-view.payload.repository'

export interface GetGuidelineTopicOutput {
	title: string
	headerImage: GuidelineHeaderImage
	blocks: GuidelineBlocks
	description: string | null
	pages: {
		id: number
		title: string
		slug: string
		description: GuidelineDescription
		displayOrder: number
		background: GuidelineBackground
		backgroundTone: GuidelineBackgroundTone
		blocks: GuidelineBlocks
	}[]
}

/**
 * Creator UI는 발행된 토픽 본문과 하위 페이지만 읽는다.
 * 토픽 슬러그는 장 안에서만 유일하므로 먼저 장으로 스코프한 뒤 토픽을 찾는다.
 * 페이지는 토픽 화면에서 한 번에 렌더하므로 page service를 반복 호출하지 않는다.
 * Payload 조회는 guideline-view repository가 소유한다.
 */
export async function getGuidelineTopic(
	chapterSlug: string,
	topicSlug: string,
): Promise<GetGuidelineTopicOutput | null> {
	const chapter = await findPublishedChapterBySlug(chapterSlug)

	if (!chapter) {
		return null
	}

	const topic = await findPublishedTopicBySlug(chapter.id, topicSlug)

	if (!topic) {
		return null
	}

	const pages = await listPublishedPagesByTopic(topic.id)

	return {
		title: topic.title,
		headerImage: topic.headerImage ?? null,
		blocks: topic.blocks ?? [],
		description: topic.description,
		pages: pages.map((page) => ({
			id: page.id,
			title: page.title,
			slug: page.slug,
			description: page.description,
			displayOrder: page.displayOrder,
			background: page.background,
			backgroundTone: page.backgroundTone,
			blocks: page.blocks,
		})),
	}
}
