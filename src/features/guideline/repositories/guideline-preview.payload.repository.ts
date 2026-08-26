import config from '@payload-config'
import { getPayload } from 'payload'
import { DEFAULT_LOCALE, FALLBACK_LOCALE } from '@/lib/locale'
import type { GuidelineDocument, User } from '@/payload-types'
import { extractTextFromLexical } from '../utils/lexical-text'

export interface DraftGuidelineDocumentData {
	background: GuidelineDocument['background']
	backgroundTone: GuidelineDocument['backgroundTone']
	blocks: GuidelineDocument['blocks']
	chapterSlug: string | null
	description: GuidelineDocument['description']
	descriptionText: string | null
	displayOrder: number
	headerImage: GuidelineDocument['headerImage']
	id: number
	label: string | null
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

function toDraftGuidelineDocument(document: GuidelineDocument): DraftGuidelineDocumentData {
	return {
		background: document.background ?? null,
		backgroundTone: document.backgroundTone ?? null,
		blocks: document.blocks ?? [],
		chapterSlug:
			typeof document.chapter === 'object' && document.chapter ? document.chapter.slug : null,
		description: document.description || null,
		descriptionText: extractTextFromLexical(document.description) || null,
		displayOrder: typeof document.displayOrder === 'number' ? document.displayOrder : -1,
		headerImage: document.headerImage ?? null,
		id: document.id,
		label: document.label || null,
		slug: document.slug,
		title: document.title,
	}
}
