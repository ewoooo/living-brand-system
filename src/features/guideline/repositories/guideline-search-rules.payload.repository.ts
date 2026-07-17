import type { Payload } from 'payload'
import type { GuidelineDocument, Rule } from '@/payload-types'
import { relationshipId } from '../utils/block-text'
import type { GuidelineSearchRuleSummary } from '../utils/guideline-search-text'

/** 검색 인덱싱에 필요한 Rule 요약을 문서·블록의 rules 관계에서 읽는다. */
export async function listGuidelineSearchRules(
	payload: Payload,
	document: GuidelineDocument,
): Promise<GuidelineSearchRuleSummary[]> {
	const references = [
		...(document.rules ?? []),
		...(document.blocks ?? []).flatMap((block) => block.rules ?? []),
	]
	const byId = new Map<number, GuidelineSearchRuleSummary | null>()
	for (const reference of references) {
		const id = relationshipId(reference)
		if (id === null) continue
		byId.set(
			id,
			typeof reference === 'object' && reference !== null
				? { key: (reference as Rule).key, title: (reference as Rule).title }
				: (byId.get(id) ?? null),
		)
	}

	const missingIds = [...byId.entries()]
		.filter(([, summary]) => summary === null)
		.map(([id]) => id)
	if (missingIds.length > 0) {
		const { docs } = await payload.find({
			collection: 'rules',
			depth: 0,
			limit: 0,
			overrideAccess: true,
			pagination: false,
			select: { key: true, title: true },
			where: { id: { in: missingIds } },
		})
		for (const rule of docs) byId.set(rule.id, { key: rule.key, title: rule.title })
	}

	return [...byId.values()].flatMap((summary) => (summary ? [summary] : []))
}
