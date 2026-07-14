import type { GuidelineDocument, User } from '@/payload-types'
import { findDraftGuidelineDocumentById } from '../repositories/guideline-preview.payload.repository'
import { extractTextFromLexical } from '../utils/lexical-text'
import {
	type GetGuidelineChapterOutput,
	getGuidelineChapter,
} from './get-guideline-chapter.service'
import {
	type GetGuidelineSectionOutput,
	getGuidelineSection,
} from './get-guideline-section.service'

interface GuidelineDocumentPreviewTarget {
	chapterSlug: string
	document: GuidelineDocument
	href: string
	level: 1 | 2 | 3
	sectionSlug: string | null
}

/**
 * Admin의 통합 문서 preview ID를 권한 적용된 draft 문서와 실제 guideline URL로 변환한다.
 * Payload 조회는 guideline-preview repository가 소유한다.
 */
export async function getGuidelineDocumentPreviewTarget(
	documentId: number,
	user: User,
): Promise<GuidelineDocumentPreviewTarget | null> {
	try {
		const document = await findDraftGuidelineDocumentById(documentId, user)
		const breadcrumbs = document.breadcrumbs ?? []
		const level = breadcrumbs.length
		if (level < 1 || level > 3) return null

		const segments = breadcrumbs.at(-1)?.url?.split('/').filter(Boolean).slice(1) ?? []
		const chapterSlug = segments[0]
		const sectionSlug = segments[1] ?? null
		const baseURL = level === 3 ? breadcrumbs[1]?.url : breadcrumbs.at(-1)?.url
		if (!chapterSlug || !baseURL || (level > 1 && !sectionSlug)) return null

		const anchor =
			level === 3 ? `#${encodeURIComponent(document.legacySlug || document.slug)}` : ''

		return {
			chapterSlug,
			document,
			href: `${baseURL}?previewDocument=${document.id}${anchor}`,
			level: level as 1 | 2 | 3,
			sectionSlug,
		}
	} catch {
		return null
	}
}

/**
 * 실제 chapter 화면은 published 하위 문서를 유지하면서 선택한 chapter만 draft로 치환한다.
 * 외부 조회는 preview target service와 기존 guideline chapter service가 소유한다.
 */
export async function getGuidelineChapterPreview(
	documentId: number,
	user: User,
): Promise<GetGuidelineChapterOutput | null> {
	const target = await getGuidelineDocumentPreviewTarget(documentId, user)
	if (target?.level !== 1) return null

	const chapter = await getGuidelineChapter(target.chapterSlug)
	if (!chapter) return null

	return {
		...chapter,
		title: target.document.title,
		label: target.document.label || null,
		description: extractTextFromLexical(target.document.description) || null,
	}
}

/**
 * 실제 section 화면은 published 구조를 유지하면서 선택한 section 또는 page만 draft로 치환한다.
 * 외부 조회는 preview target service와 기존 guideline section service가 소유한다.
 */
export async function getGuidelineSectionPreview(
	documentId: number,
	user: User,
): Promise<GetGuidelineSectionOutput | null> {
	const target = await getGuidelineDocumentPreviewTarget(documentId, user)

	if (!target?.sectionSlug || target.level === 1) return null

	const section = await getGuidelineSection(target.chapterSlug, target.sectionSlug)

	if (!section) return null
	if (target.level === 2) {
		return {
			...section,
			title: target.document.title,
			headerImage: target.document.headerImage ?? null,
			blocks: target.document.blocks ?? [],
			description: extractTextFromLexical(target.document.description) || null,
		}
	}

	const page = {
		id: target.document.id,
		title: target.document.title,
		slug: target.document.legacySlug || target.document.slug,
		description: target.document.description || null,
		displayOrder: target.document.displayOrder,
		blocks: target.document.blocks || [],
	}

	return {
		...section,
		pages: [...section.pages.filter((item) => item.id !== page.id), page].sort(
			(a, b) => a.displayOrder - b.displayOrder,
		),
	}
}
