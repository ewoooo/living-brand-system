export interface GuidelineSearchInput {
	query: string
}

export interface GuidelineSearchResult {
	title: string
	collection: string
	id: string
}

export interface GuidelineSearchRepository {
	search(input: GuidelineSearchInput): Promise<GuidelineSearchResult[]>
}
