import { cache } from 'react'
import type { GuidelineDocument } from '@/payload-types'
import { listPublishedGuidelineNavigationDocuments } from '../repositories/guideline-view.payload.repository'
import { extractTextFromLexical } from '../utils/lexical-text'
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
		const [metadata, documents] = await Promise.all([
			getGuidelineMetadata(),
			listPublishedGuidelineNavigationDocuments(),
		])

		return {
			metadata,
			title: metadata.documentTitle,
			chapters: buildGuidelineNavigationChapters(documents),
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

type NavigationDocument = Pick<
	GuidelineDocument,
	'id' | 'title' | 'slug' | 'legacySlug' | 'description' | 'parent' | 'breadcrumbs'
>

export function buildGuidelineNavigationChapters(documents: NavigationDocument[]) {
	const children = new Map<number | null, NavigationDocument[]>()
	for (const document of documents) {
		const parentId = relationshipId(document.parent)
		children.set(parentId, [...(children.get(parentId) ?? []), document])
	}

	return (children.get(null) ?? []).map((chapter) => ({
		id: chapter.id,
		title: chapter.title,
		description: extractTextFromLexical(chapter.description) || null,
		href: breadcrumbURL(chapter),
		sections: (children.get(chapter.id) ?? []).map((section) => ({
			id: section.id,
			title: section.title,
			href: breadcrumbURL(section),
			pages: (children.get(section.id) ?? []).map((page) => ({
				id: page.id,
				title: page.title,
				href: `${breadcrumbURL(section)}#${pathSegment(page)}`,
			})),
		})),
	}))
}

function breadcrumbURL(document: NavigationDocument) {
	return document.breadcrumbs?.at(-1)?.url || `/guideline/${document.slug}`
}

function pathSegment(document: NavigationDocument) {
	return document.legacySlug || document.slug
}

function relationshipId(value: NavigationDocument['parent']): number | null {
	if (typeof value === 'number') return value
	return value?.id ?? null
}
