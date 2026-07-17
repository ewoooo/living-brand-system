import config from '@payload-config'
import { getPayload } from 'payload'
import { DEFAULT_LOCALE, FALLBACK_LOCALE } from '@/lib/locale'
import type { GuidelineDocument, User } from '@/payload-types'
import { extractTextFromLexical } from '../utils/lexical-text'

export interface DraftGuidelineDocumentData {
	blocks: GuidelineDocument['blocks']
	breadcrumbs: { url: string | null }[]
	description: GuidelineDocument['description']
	descriptionText: string | null
	displayOrder: number
	headerImage: GuidelineDocument['headerImage']
	id: number
	label: string | null
	parentId: number | null
	slug: string
	title: string
}

/** 권한이 적용된 draft Guideline 문서를 preview DTO로 변환해 조회한다. */
export async function findDraftGuidelineDocumentById(
	documentId: number,
	user: User,
): Promise<DraftGuidelineDocumentData | null> {
	const payload = await getPayload({ config })

	const document = await payload.findByID({
		collection: 'guideline-documents',
		id: documentId,
		depth: 2,
		disableErrors: true,
		draft: true,
		fallbackLocale: FALLBACK_LOCALE,
		locale: DEFAULT_LOCALE,
		overrideAccess: false,
		user,
	})

	return document ? toDraftGuidelineDocument(document) : null
}

/** 권한이 적용된 draft 하위 문서를 preview DTO 목록으로 변환해 조회한다. */
export async function listDraftGuidelineChildren(
	parentId: number,
	user: User,
): Promise<DraftGuidelineDocumentData[]> {
	const payload = await getPayload({ config })

	const children = await payload.find({
		collection: 'guideline-documents',
		depth: 2,
		draft: true,
		fallbackLocale: FALLBACK_LOCALE,
		limit: 100,
		locale: DEFAULT_LOCALE,
		overrideAccess: false,
		sort: 'displayOrder',
		user,
		where: { parent: { equals: parentId } },
	})

	return children.docs.map(toDraftGuidelineDocument)
}

function toDraftGuidelineDocument(document: GuidelineDocument): DraftGuidelineDocumentData {
	return {
		blocks: document.blocks ?? [],
		breadcrumbs: (document.breadcrumbs ?? []).map((breadcrumb) => ({
			url: breadcrumb.url || null,
		})),
		description: document.description || null,
		descriptionText: extractTextFromLexical(document.description) || null,
		displayOrder: typeof document.displayOrder === 'number' ? document.displayOrder : -1,
		headerImage: document.headerImage ?? null,
		id: document.id,
		label: document.label || null,
		parentId: relationshipId(document.parent),
		slug: document.slug,
		title: document.title,
	}
}

function relationshipId(value: GuidelineDocument['parent']): number | null {
	if (typeof value === 'number') return value
	return value?.id ?? null
}
