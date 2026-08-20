import config from '@payload-config'
import { getPayload } from 'payload'
import { FALLBACK_LOCALE, DEFAULT_LOCALE as LOCALE } from '@/lib/locale'
import type { GuidelineDocument } from '@/payload-types'
import { extractTextFromLexical } from '../utils/lexical-text'

export type GuidelineBackground = GuidelineDocument['background']
export type GuidelineBackgroundTone = GuidelineDocument['backgroundTone']
export type GuidelineBlocks = GuidelineDocument['blocks']
export type GuidelineDescription = GuidelineDocument['description']
export type GuidelineHeaderImage = GuidelineDocument['headerImage']

export interface GuidelineMetadataData {
	companyName: string
	documentTitle: string
	faviconHref: string | null
	issuedLabel: string | null
	primaryDarkHex: string | null
	primaryHex: string | null
}

export interface GuidelineNavigationDocumentData {
	description: string | null
	href: string | null
	id: number
	parentId: number | null
	slug: string
	title: string
}

export interface GuidelineChapterData {
	description: string | null
	id: number
	label: string | null
	title: string
}

export interface GuidelineSectionSummaryData {
	description: string | null
	id: number
	slug: string
	title: string
}

export interface GuidelineSectionData {
	blocks: GuidelineBlocks
	description: string | null
	headerImage: GuidelineHeaderImage
	id: number
	title: string
}

export interface GuidelinePageData {
	background: GuidelineBackground
	backgroundTone: GuidelineBackgroundTone
	blocks: GuidelineBlocks
	description: GuidelineDescription
	displayOrder: number
	id: number
	slug: string
	title: string
}

/**
 * Creator UI 렌더링용 published guideline 조회 repository.
 * guideline read service가 쓰는 Payload Local API 호출은 모두 이 파일이 소유한다.
 */

export async function findGuidelineMetadataGlobal(): Promise<GuidelineMetadataData> {
	const payload = await getPayload({ config })

	const guideline = await payload.findGlobal({
		slug: 'guideline',
		depth: 1,
		locale: LOCALE,
		fallbackLocale: FALLBACK_LOCALE,
		draft: false,
		select: {
			companyName: true,
			documentTitle: true,
			favicon: true,
			issuedLabel: true,
			primaryColor: true,
			primaryColorDark: true,
		},
	})

	return {
		companyName: guideline.companyName,
		documentTitle: guideline.documentTitle,
		faviconHref: relationshipString(guideline.favicon, 'url'),
		issuedLabel: guideline.issuedLabel || null,
		primaryDarkHex: relationshipString(guideline.primaryColorDark, 'hex'),
		primaryHex: relationshipString(guideline.primaryColor, 'hex'),
	}
}

export async function listPublishedGuidelineNavigationDocuments(): Promise<
	GuidelineNavigationDocumentData[]
> {
	const payload = await getPayload({ config })
	const documents = await payload.find({
		collection: 'guideline-documents',
		depth: 0,
		draft: false,
		fallbackLocale: FALLBACK_LOCALE,
		limit: 2000,
		locale: LOCALE,
		sort: 'displayOrder',
		select: {
			title: true,
			slug: true,
			description: true,
			displayOrder: true,
			parent: true,
			breadcrumbs: true,
		},
	})

	return documents.docs.map((document) => ({
		description: extractTextFromLexical(document.description) || null,
		href: document.breadcrumbs?.at(-1)?.url || null,
		id: document.id,
		parentId: relationshipId(document.parent),
		slug: document.slug,
		title: document.title,
	}))
}

export async function findPublishedChapterBySlug(
	chapterSlug: string,
): Promise<GuidelineChapterData | null> {
	const payload = await getPayload({ config })
	const chapters = await payload.find({
		collection: 'guideline-documents',
		depth: 0,
		draft: false,
		fallbackLocale: FALLBACK_LOCALE,
		limit: 1,
		locale: LOCALE,
		where: {
			and: [{ slug: { equals: chapterSlug } }, { parent: { exists: false } }],
		},
		select: {
			title: true,
			label: true,
			slug: true,
			description: true,
		},
	})

	const chapter = chapters.docs[0]
	return chapter
		? {
				description: extractTextFromLexical(chapter.description) || null,
				id: chapter.id,
				label: chapter.label || null,
				title: chapter.title,
			}
		: null
}

export async function findPublishedSectionBySlug(
	chapterId: number,
	sectionSlug: string,
): Promise<GuidelineSectionData | null> {
	const payload = await getPayload({ config })
	const sections = await payload.find({
		collection: 'guideline-documents',
		depth: 1,
		draft: false,
		fallbackLocale: FALLBACK_LOCALE,
		limit: 1,
		locale: LOCALE,
		where: {
			and: [{ slug: { equals: sectionSlug } }, { parent: { equals: chapterId } }],
		},
		select: {
			title: true,
			slug: true,
			description: true,
			headerImage: true,
			blocks: true,
		},
	})

	const section = sections.docs[0]
	return section
		? {
				blocks: section.blocks ?? [],
				description: extractTextFromLexical(section.description) || null,
				headerImage: section.headerImage ?? null,
				id: section.id,
				title: section.title,
			}
		: null
}

export async function listPublishedSectionsByChapter(
	chapterId: number,
): Promise<GuidelineSectionSummaryData[]> {
	const sections = await listPublishedChildren(chapterId, {
		title: true,
		slug: true,
		description: true,
	})

	return sections.map((section) => ({
		description: extractTextFromLexical(section.description) || null,
		id: section.id,
		slug: section.slug,
		title: section.title,
	}))
}

export async function listPublishedPagesBySection(sectionId: number): Promise<GuidelinePageData[]> {
	// depth 1: 페이지 blocks의 이미지(application-images)·색상(brand-colors) 관계를 populate해야 렌더된다.
	// 페이지 자신의 면(background)도 같은 depth로 hex까지 채워진다.
	const pages = await listPublishedChildren(
		sectionId,
		{
			title: true,
			slug: true,
			description: true,
			displayOrder: true,
			background: true,
			backgroundTone: true,
			blocks: true,
		},
		1,
	)

	return pages.map((page) => ({
		background: page.background ?? null,
		backgroundTone: page.backgroundTone ?? null,
		blocks: page.blocks ?? [],
		description: page.description || null,
		displayOrder: typeof page.displayOrder === 'number' ? page.displayOrder : -1,
		id: page.id,
		slug: page.slug,
		title: page.title,
	}))
}

async function listPublishedChildren(parentId: number, select: Record<string, true>, depth = 0) {
	const payload = await getPayload({ config })
	const children = await payload.find({
		collection: 'guideline-documents',
		depth,
		draft: false,
		fallbackLocale: FALLBACK_LOCALE,
		limit: 100,
		locale: LOCALE,
		sort: 'displayOrder',
		where: { parent: { equals: parentId } },
		select,
	})

	return children.docs
}

function relationshipId(value: GuidelineDocument['parent']): number | null {
	if (typeof value === 'number') return value
	return value?.id ?? null
}

function relationshipString(value: unknown, key: string): string | null {
	if (!value || typeof value !== 'object' || !(key in value)) return null
	const candidate = (value as Record<string, unknown>)[key]
	return typeof candidate === 'string' ? candidate : null
}
