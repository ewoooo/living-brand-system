import type { PayloadRequest } from 'payload'

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
