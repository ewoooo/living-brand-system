import config from '@payload-config'
import { getPayload } from 'payload'

import type {
	GuidelineSearchInput,
	GuidelineSearchRepository,
	GuidelineSearchResult,
} from './guideline-search.repository'

type SearchDoc = {
	title?: string | null
	doc?: {
		relationTo?: string | null
		value?: string | number | null
	} | null
}

/**
 * Agent tool의 published guideline 검색을 Payload search collection으로 수행한다.
 * 접근 제어는 Payload Local API가 user와 overrideAccess 설정으로 강제한다.
 */
export class PayloadGuidelineSearchRepository implements GuidelineSearchRepository {
	constructor(private readonly user: unknown) {}

	async search(input: GuidelineSearchInput): Promise<GuidelineSearchResult[]> {
		const query = input.query.trim()

		if (!query) {
			return []
		}

		const payload = await getPayload({ config })
		const results = await payload.find({
			collection: 'search',
			depth: 0,
			limit: 5,
			overrideAccess: false,
			sort: '-priority',
			user: this.user as never,
			where: {
				title: {
					like: query,
				},
			},
		})

		return (results.docs as SearchDoc[])
			.map((result) => ({
				title: result.title || '',
				collection: result.doc?.relationTo || '',
				id: String(result.doc?.value || ''),
			}))
			.filter((result) => result.title && result.collection && result.id)
	}
}
