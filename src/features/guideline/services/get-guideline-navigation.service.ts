import { cache } from 'react'
import {
	listPublishedChapters,
	listPublishedPageNavItems,
	listPublishedSectionNavItems,
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
		sections: {
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
 * Creator UI 사이드바는 발행된 가이드라인의 목차 정보만 읽는다(장 → 섹션 → 페이지).
 * 본문 렌더링은 chapter/section service가 담당한다.
 * Payload 조회는 guideline-view repository가 소유한다.
 */
export const getGuidelineNavigation = cache(async (): Promise<GetGuidelineNavigationOutput> => {
	try {
		const [metadata, chapters, sections, pages] = await Promise.all([
			getGuidelineMetadata(),
			listPublishedChapters(),
			listPublishedSectionNavItems(),
			listPublishedPageNavItems(),
		])

		return {
			metadata,
			title: metadata.documentTitle,
			// ponytail: sidebar lists are tiny; index pages if this grows.
			chapters: chapters.map((chapter) => ({
				id: chapter.id,
				title: chapter.title,
				description: chapter.description || null,
				href: `/guideline/${chapter.slug}`,
				sections: sections
					.filter((section) => section.chapter === chapter.id)
					.map((section) => ({
						id: section.id,
						title: section.title,
						href: `/guideline/${chapter.slug}/${section.slug}`,
						pages: pages
							.filter((page) => getId(page.section) === section.id)
							.map((page) => ({
								id: page.id,
								title: page.title,
								href: `/guideline/${chapter.slug}/${section.slug}#${page.slug}`,
							})),
					})),
			})),
		}
	} catch {
		return {
			metadata: {
				companyName: 'Unconfigured Company',
				documentTitle: 'Untitled Guideline',
				faviconHref: null,
				issuedLabel: null,
			},
			title: 'Untitled Guideline',
			chapters: [],
		}
	}
})

function getId(value: number | { id: number }) {
	return typeof value === 'object' ? value.id : value
}
