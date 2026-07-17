import type { GuidelineDocument, User } from '@/payload-types'
import {
	findDraftGuidelineDocumentById,
	listDraftGuidelineChildren,
} from '../repositories/guideline-preview.payload.repository'
import { relationshipId } from '../utils/block-text'
import { extractTextFromLexical } from '../utils/lexical-text'
import type { GetGuidelineChapterOutput } from './get-guideline-chapter.service'
import type { GetGuidelineSectionOutput } from './get-guideline-section.service'

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
	const document = await findDraftGuidelineDocumentById(documentId, user)
	if (!document) return null

	const breadcrumbs = document.breadcrumbs ?? []
	const level = breadcrumbs.length
	if (level < 1 || level > 3) return null

	const segments = breadcrumbs.at(-1)?.url?.split('/').filter(Boolean).slice(1) ?? []
	const chapterSlug = segments[0]
	const sectionSlug = segments[1] ?? null
	const baseURL = level === 3 ? breadcrumbs[1]?.url : breadcrumbs.at(-1)?.url
	if (!chapterSlug || !baseURL || (level > 1 && !sectionSlug)) return null

	// #앵커를 붙이지 않는다. Better Editor iframe이 동일 출처 URL의 앵커를 로드하면
	// 부모 admin 문서까지 스크롤돼 오버레이가 헤더 높이만큼 말려 올라간다.
	// 문서 위치 이동은 ScrollToPreviewDocument가 iframe 안에서만 수행한다.
	return {
		chapterSlug,
		document,
		href: `${baseURL}?previewDocument=${document.id}`,
		level: level as 1 | 2 | 3,
		sectionSlug,
	}
}

/**
 * Chapter preview는 발행 여부와 무관하게 선택한 draft와 최신 draft 하위 문서를 렌더링한다.
 * Payload 조회는 guideline-preview repository가 소유한다.
 */
export async function getGuidelineChapterPreview(
	documentId: number,
	user: User,
): Promise<GetGuidelineChapterOutput | null> {
	const target = await getGuidelineDocumentPreviewTarget(documentId, user)
	if (target?.level !== 1) return null

	const sections = await listDraftGuidelineChildren(target.document.id, user)
	return {
		title: target.document.title,
		label: target.document.label || null,
		description: extractTextFromLexical(target.document.description) || null,
		sections: sections.map((section) => ({
			id: section.id,
			title: section.title,
			slug: section.slug,
			description: extractTextFromLexical(section.description) || null,
		})),
	}
}

/**
 * Section preview는 draft 부모와 최신 draft 하위 문서를 함께 읽어 신규 트리도 렌더링한다.
 * Payload 조회는 guideline-preview repository가 소유한다.
 */
export async function getGuidelineSectionPreview(
	documentId: number,
	user: User,
): Promise<GetGuidelineSectionOutput | null> {
	const target = await getGuidelineDocumentPreviewTarget(documentId, user)

	if (!target?.sectionSlug || target.level === 1) return null

	let section: GuidelineDocument | null = target.document
	if (target.level === 3) {
		const parentId = relationshipId(target.document.parent)
		if (parentId === null) return null
		section = await findDraftGuidelineDocumentById(parentId, user)
	}
	if (section?.breadcrumbs?.length !== 2) return null

	const pages = await listDraftGuidelineChildren(section.id, user)
	return {
		title: section.title,
		headerImage: section.headerImage ?? null,
		blocks: section.blocks ?? [],
		description: extractTextFromLexical(section.description) || null,
		pages: pages.map((page) => ({
			id: page.id,
			title: page.title,
			slug: page.slug,
			description: page.description || null,
			displayOrder: page.displayOrder,
			blocks: page.blocks || [],
		})),
	}
}
