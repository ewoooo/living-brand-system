import config from '@payload-config'
import { getPayload } from 'payload'
import { FALLBACK_LOCALE, DEFAULT_LOCALE as LOCALE } from '@/lib/locale'

/**
 * Creator UI 렌더링용 published guideline 조회 repository.
 * guideline read service가 쓰는 Payload Local API 호출은 모두 이 파일이 소유한다.
 */

export async function findGuidelineMetadataGlobal() {
	const payload = await getPayload({ config })

	return payload.findGlobal({
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
}

export async function listPublishedGuidelineNavigationDocuments() {
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

	return documents.docs
}

export async function findPublishedChapterBySlug(chapterSlug: string) {
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

	return chapters.docs[0] ?? null
}

export async function findPublishedSectionBySlug(chapterId: number, sectionSlug: string) {
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

	return sections.docs[0] ?? null
}

export async function listPublishedSectionsByChapter(chapterId: number) {
	return listPublishedChildren(chapterId, {
		title: true,
		slug: true,
		description: true,
	})
}

export async function listPublishedPagesBySection(sectionId: number) {
	// depth 1: 페이지 blocks의 이미지(application-images)·색상(brand-colors) 관계를 populate해야 렌더된다.
	return listPublishedChildren(
		sectionId,
		{
			title: true,
			slug: true,
			description: true,
			displayOrder: true,
			blocks: true,
		},
		1,
	)
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
