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
	sections: { anchor: string; title: string }[]
	slug: string
	title: string
}

export interface GuidelineChapterData {
	description: string | null
	id: number
	label: string | null
	title: string
}

export interface GuidelineTopicSummaryData {
	description: string | null
	id: number
	slug: string
	title: string
}

export interface GuidelineTopicData {
	blocks: GuidelineBlocks
	description: string | null
	headerImage: GuidelineHeaderImage
	id: number
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
			// 🔴 꼭지 목차는 `section` 블록에서 나온다. blockType별로 골라 담으면 나머지 블록
			//    테이블(blk·img·위젯 20종)은 조인 자체가 일어나지 않는다
			//    (`@payloadcms/drizzle` find/traverseFields.js — 목록에 없는 블록은 빈 select로 접힌다).
			blocks: { section: { anchor: true, title: true } },
		},
	})

	return documents.docs.map((document) => ({
		description: extractTextFromLexical(document.description) || null,
		href: document.breadcrumbs?.at(-1)?.url || null,
		id: document.id,
		parentId: relationshipId(document.parent),
		sections: (document.blocks ?? []).flatMap((block) =>
			block.blockType === 'section' && block.anchor
				? [{ anchor: block.anchor, title: block.title }]
				: [],
		),
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

export async function findPublishedTopicBySlug(
	chapterId: number,
	topicSlug: string,
): Promise<GuidelineTopicData | null> {
	const payload = await getPayload({ config })
	// depth 1: 꼭지(section) 블록이 품은 이미지(application-images)·색상(brand-colors) 관계를
	// populate해야 렌더된다. 꼭지 자신의 면(background)도 같은 depth로 hex까지 채워진다.
	const topics = await payload.find({
		collection: 'guideline-documents',
		depth: 1,
		draft: false,
		fallbackLocale: FALLBACK_LOCALE,
		limit: 1,
		locale: LOCALE,
		where: {
			and: [{ slug: { equals: topicSlug } }, { parent: { equals: chapterId } }],
		},
		select: {
			title: true,
			slug: true,
			description: true,
			headerImage: true,
			blocks: true,
		},
	})

	const topic = topics.docs[0]
	return topic
		? {
				blocks: topic.blocks ?? [],
				description: extractTextFromLexical(topic.description) || null,
				headerImage: topic.headerImage ?? null,
				id: topic.id,
				title: topic.title,
			}
		: null
}

export async function listPublishedTopicsByChapter(
	chapterId: number,
): Promise<GuidelineTopicSummaryData[]> {
	const topics = await listPublishedChildren(chapterId, {
		title: true,
		slug: true,
		description: true,
	})

	return topics.map((topic) => ({
		description: extractTextFromLexical(topic.description) || null,
		id: topic.id,
		slug: topic.slug,
		title: topic.title,
	}))
}

async function listPublishedChildren(parentId: number, select: Record<string, true>) {
	const payload = await getPayload({ config })
	const children = await payload.find({
		collection: 'guideline-documents',
		depth: 0,
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
