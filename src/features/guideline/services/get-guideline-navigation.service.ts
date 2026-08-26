import { cache } from 'react'
import {
	type GuidelineNavigationDocumentData,
	listPublishedGuidelineNavigationDocuments,
} from '../repositories/guideline-view.payload.repository'
import {
	type GetGuidelineMetadataOutput,
	getGuidelineMetadata,
} from './get-guideline-metadata.service'

export interface GetGuidelineNavigationOutput {
	metadata: GetGuidelineMetadataOutput
	title: string
	chapters: {
		id: number
		title: string
		description: string | null
		href: string
		topics: {
			id: number
			title: string
			href: string
			pages: {
				id: number
				title: string
				href: string
			}[]
		}[]
	}[]
}

/**
 * Creator UI 사이드바는 발행된 가이드라인의 목차 정보만 읽는다(장 → 토픽 → 페이지).
 * 본문 렌더링은 chapter/topic service가 담당한다.
 * Payload 조회는 guideline-view repository가 소유한다.
 */
export const getGuidelineNavigation = cache(async (): Promise<GetGuidelineNavigationOutput> => {
	const [metadata, documents] = await Promise.all([
		getGuidelineMetadata(),
		listPublishedGuidelineNavigationDocuments(),
	])

	return {
		metadata,
		title: metadata.documentTitle,
		chapters: buildGuidelineNavigationChapters(documents),
	}
})

/**
 * published 문서 목록을 장→토픽 네비게이션 트리로 조립하는 순수 함수. 외부 I/O 없음
 * (Payload 조회는 guideline-view repository 소유). 단위 테스트 재사용을 위해 export한다.
 */
export function buildGuidelineNavigationChapters(documents: GuidelineNavigationDocumentData[]) {
	const children = new Map<number | null, GuidelineNavigationDocumentData[]>()
	for (const document of documents) {
		children.set(document.parentId, [...(children.get(document.parentId) ?? []), document])
	}

	return (children.get(null) ?? []).map((chapter) => ({
		id: chapter.id,
		title: chapter.title,
		description: chapter.description,
		href: breadcrumbURL(chapter),
		topics: (children.get(chapter.id) ?? []).map((topic) => ({
			id: topic.id,
			title: topic.title,
			href: breadcrumbURL(topic),
			pages: (children.get(topic.id) ?? []).map((page) => ({
				id: page.id,
				title: page.title,
				href: `${breadcrumbURL(topic)}#${page.slug}`,
			})),
		})),
	}))
}

function breadcrumbURL(document: GuidelineNavigationDocumentData) {
	return document.href || `/guideline/${document.slug}`
}
