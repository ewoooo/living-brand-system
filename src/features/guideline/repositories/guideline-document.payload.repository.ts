import type { PayloadRequest } from 'payload'
import { relationshipId } from '@/features/guideline/utils/block-text'

/** Admin 목록에 필요한 draft 토픽 필드만 읽고 관계 값을 ID로 정규화한다. */
export async function listEditableGuidelineDocuments(
	payload: PayloadRequest['payload'],
	{
		locale,
		user,
	}: {
		locale?: 'en' | 'ko'
		user: Parameters<PayloadRequest['payload']['find']>[0]['user']
	},
) {
	const { docs } = await payload.find({
		collection: 'guideline-documents',
		depth: 0,
		draft: true,
		limit: 0,
		locale,
		overrideAccess: false,
		sort: 'displayOrder',
		user,
	})

	return docs.map((document) => ({
		id: document.id,
		title: document.title,
		chapter: relationshipId(document.chapter),
		displayOrder: document.displayOrder,
		_status: document._status,
	}))
}

/** 같은 locale·챕터 안에 slug가 이미 있는지 조회한다. */
export async function hasGuidelineDocumentSlugConflict(
	req: PayloadRequest,
	{
		chapterId,
		currentId,
		slug,
	}: {
		chapterId: number | null
		currentId: number | null
		slug: string
	},
) {
	const duplicate = await req.payload.find({
		collection: 'guideline-documents',
		depth: 0,
		draft: true,
		fallbackLocale: false,
		limit: 1,
		locale: req.locale,
		overrideAccess: true,
		pagination: false,
		req,
		where: {
			and: [
				{ slug: { equals: slug } },
				chapterId === null
					? { chapter: { exists: false } }
					: { chapter: { equals: chapterId } },
				...(currentId === null ? [] : [{ id: { not_equals: currentId } }]),
			],
		},
	})

	return duplicate.docs.length > 0
}

/** Admin 목록이 토픽을 묶을 챕터 이름표. 순서는 챕터의 displayOrder를 따른다. */
export async function listGuidelineChapterOptions(
	payload: PayloadRequest['payload'],
	{
		locale,
		user,
	}: { locale?: 'en' | 'ko'; user: Parameters<PayloadRequest['payload']['find']>[0]['user'] },
) {
	const { docs } = await payload.find({
		collection: 'guideline-chapters',
		depth: 0,
		limit: 0,
		locale,
		overrideAccess: false,
		sort: 'displayOrder',
		user,
	})

	return docs.map((chapter) => ({ id: chapter.id, title: chapter.title }))
}
