import type { PayloadRequest } from 'payload'
import type { GuidelinePage, GuidelineSection } from '@/payload-types'

type ParentCollection = 'guideline-pages' | 'guideline-sections'
type ParentDocument = Pick<GuidelinePage | GuidelineSection, 'id' | 'blocks' | '_status'>

/**
 * 임베디드 block을 Rule relationship 대상으로 사용할 수 있게 식별자 인덱스를 동기화한다.
 * Payload 조회·생성·삭제 I/O는 이 서비스가 소유하고 block 콘텐츠는 부모 문서가 계속 소유한다.
 */
export async function syncGuidelineBlockDocuments({
	collection,
	doc,
	req,
}: {
	collection: ParentCollection
	doc: ParentDocument
	req: PayloadRequest
}) {
	if (doc._status && doc._status !== 'published') return

	const existing = await req.payload.find({
		collection: 'guideline-blocks',
		depth: 0,
		limit: 1000,
		where: {
			and: [
				{ 'parent.relationTo': { equals: collection } },
				{ 'parent.value': { equals: doc.id } },
			],
		},
		req,
	})
	const existingByKey = new Map(existing.docs.map((block) => [block.key, block]))
	const desiredKeys = new Set<string>()

	for (const [displayOrder, block] of (doc.blocks ?? []).entries()) {
		if (!block.id) continue
		const key = `${collection}:${doc.id}:${block.id}`
		desiredKeys.add(key)
		const data = {
			key,
			parent: { relationTo: collection, value: doc.id } as const,
			sourceBlockId: block.id,
			blockType: block.blockType,
			displayOrder,
		}
		const current = existingByKey.get(key)
		if (current) {
			await req.payload.update({ collection: 'guideline-blocks', id: current.id, data, req })
		} else {
			await req.payload.create({ collection: 'guideline-blocks', data, req })
		}
	}

	for (const block of existing.docs) {
		if (!desiredKeys.has(block.key)) {
			await req.payload.delete({ collection: 'guideline-blocks', id: block.id, req })
		}
	}
}
