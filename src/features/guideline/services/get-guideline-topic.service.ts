import {
	findChapterBySlug,
	findPublishedTopicBySlug,
	type GuidelineBlocks,
	type GuidelineHeaderImage,
} from '../repositories/guideline-view.payload.repository'

export interface GetGuidelineTopicOutput {
	title: string
	headerImage: GuidelineHeaderImage
	blocks: GuidelineBlocks
	description: string | null
}

/**
 * Creator UI는 발행된 토픽 본문만 읽는다. 꼭지는 그 본문 안의 `section` 블록이라 별도 조회가 없다.
 * 토픽 슬러그는 장 안에서만 유일하므로 먼저 장으로 스코프한 뒤 토픽을 찾는다.
 * Payload 조회는 guideline-view repository가 소유한다.
 */
export async function getGuidelineTopic(
	chapterSlug: string,
	topicSlug: string,
): Promise<GetGuidelineTopicOutput | null> {
	const chapter = await findChapterBySlug(chapterSlug)

	if (!chapter) {
		return null
	}

	const topic = await findPublishedTopicBySlug(chapter.id, topicSlug)

	if (!topic) {
		return null
	}

	return {
		title: topic.title,
		headerImage: topic.headerImage ?? null,
		blocks: topic.blocks ?? [],
		description: topic.description,
	}
}
