import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Creator UI 렌더링용 published guideline 조회 repository.
 * guideline read service가 쓰는 Payload Local API 호출은 모두 이 파일이 소유한다.
 */

const LOCALE = 'ko' as const
const FALLBACK_LOCALE = 'en' as const

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
		},
	})
}

export async function listPublishedSections() {
	const payload = await getPayload({ config })
	const sections = await payload.find({
		collection: 'sections',
		sort: 'displayOrder',
		limit: 100,
		locale: LOCALE,
		fallbackLocale: FALLBACK_LOCALE,
		draft: false,
		select: {
			title: true,
			slug: true,
			description: true,
		},
	})

	return sections.docs
}

export async function listPublishedPageNavItems() {
	const payload = await getPayload({ config })
	const pages = await payload.find({
		collection: 'guideline-pages',
		depth: 0,
		sort: 'displayOrder',
		limit: 500,
		locale: LOCALE,
		fallbackLocale: FALLBACK_LOCALE,
		draft: false,
		select: {
			title: true,
			slug: true,
			section: true,
		},
	})

	return pages.docs
}

export async function findPublishedSectionBySlug(sectionSlug: string) {
	const payload = await getPayload({ config })
	const sections = await payload.find({
		collection: 'sections',
		where: {
			slug: {
				equals: sectionSlug,
			},
		},
		limit: 1,
		locale: LOCALE,
		fallbackLocale: FALLBACK_LOCALE,
		draft: false,
		select: {
			title: true,
			description: true,
		},
	})

	return sections.docs[0] ?? null
}

export async function listPublishedPagesBySection(sectionId: number) {
	const payload = await getPayload({ config })
	const pages = await payload.find({
		collection: 'guideline-pages',
		where: {
			section: {
				equals: sectionId,
			},
		},
		sort: 'displayOrder',
		limit: 100,
		locale: LOCALE,
		fallbackLocale: FALLBACK_LOCALE,
		draft: false,
		select: {
			title: true,
			slug: true,
			description: true,
			displayOrder: true,
			blocks: true,
		},
	})

	return pages.docs
}
