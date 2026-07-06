import { cache } from 'react'
import {
	listPublishedPageNavItems,
	listPublishedSections,
} from '../repositories/guideline-view.payload.repository'
import {
	type GetGuidelineMetadataOutput,
	getGuidelineMetadata,
} from './get-guideline-metadata.service'

export interface GetGuidelineNavigationOutput {
	metadata: GetGuidelineMetadataOutput
	title: string
	sections: {
		id: number
		title: string
		description: string | null
		href: string
		pages: {
			id: number
			title: string
			href: string
		}[]
	}[]
}

/**
 * Creator UI 사이드바는 발행된 가이드라인의 목차 정보만 읽는다.
 * 본문 렌더링은 page/section service가 담당한다.
 */
export const getGuidelineNavigation = cache(async (): Promise<GetGuidelineNavigationOutput> => {
	try {
		const [metadata, sections, pages] = await Promise.all([
			getGuidelineMetadata(),
			listPublishedSections(),
			listPublishedPageNavItems(),
		])

		return {
			metadata,
			title: metadata.documentTitle,
			// ponytail: sidebar lists are tiny; index pages if this grows.
			sections: sections.map((section) => ({
				id: section.id,
				title: section.title,
				description: section.description || null,
				href: `/guideline/${section.slug}`,
				pages: pages
					.filter((page) => page.section === section.id)
					.map((page) => ({
						id: page.id,
						title: page.title,
						href: `/guideline/${section.slug}#${page.slug}`,
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
			sections: [],
		}
	}
})
