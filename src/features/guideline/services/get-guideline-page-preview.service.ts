import type { User } from '@/payload-types'
import { findDraftGuidelinePageById } from '../repositories/guideline-preview.payload.repository'
import {
	type GetGuidelineSectionOutput,
	getGuidelineSection,
} from './get-guideline-section.service'

interface GuidelinePagePreviewTarget {
	chapterSlug: string
	href: string
	page: GetGuidelineSectionOutput['pages'][number]
	sectionSlug: string
}

/**
 * Admin의 page preview ID를 권한 적용된 draft 문서와 실제 guideline URL로 변환한다.
 * Payload 조회는 guideline-preview repository가 소유한다.
 */
export async function getGuidelinePagePreviewTarget(
	pageId: number,
	user: User,
): Promise<GuidelinePagePreviewTarget | null> {
	try {
		const page = await findDraftGuidelinePageById(pageId, user)
		const section = typeof page.section === 'object' ? page.section : null
		const chapter = section && typeof section.chapter === 'object' ? section.chapter : null

		if (!section || !chapter) return null

		return {
			chapterSlug: chapter.slug,
			href: `/guideline/${encodeURIComponent(chapter.slug)}/${encodeURIComponent(section.slug)}?previewPage=${page.id}#${encodeURIComponent(page.slug)}`,
			page: {
				id: page.id,
				title: page.title,
				slug: page.slug,
				description: page.description || null,
				displayOrder: page.displayOrder,
				blocks: page.blocks || [],
			},
			sectionSlug: section.slug,
		}
	} catch {
		return null
	}
}

/**
 * 실제 section 화면은 published 상태를 유지하면서 선택한 page 한 건만 draft로 치환한다.
 * 외부 조회는 preview target service와 기존 guideline section service가 소유한다.
 */
export async function getGuidelinePagePreview(
	pageId: number,
	user: User,
): Promise<GetGuidelineSectionOutput | null> {
	const target = await getGuidelinePagePreviewTarget(pageId, user)

	if (!target) return null

	const section = await getGuidelineSection(target.chapterSlug, target.sectionSlug)

	if (!section) return null

	return {
		...section,
		pages: [...section.pages.filter((page) => page.id !== target.page.id), target.page].sort(
			(a, b) => a.displayOrder - b.displayOrder,
		),
	}
}
