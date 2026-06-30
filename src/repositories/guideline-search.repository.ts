export interface GuidelineSearchInput {
	query: string
}

export type GuidelineDocumentCollection = 'guideline-pages' | 'sections'

export interface GuidelineSearchResult {
	title: string
	collection: string
	id: string
}

export interface GuidelineDocumentInput {
	collection: GuidelineDocumentCollection
	id: string
}

export interface GuidelineDocumentResult {
	title: string
	collection: GuidelineDocumentCollection
	id: string
	content: string
	relatedPages?: {
		id: string
		title: string
	}[]
}

export interface GuidelineSearchRepository {
	search(input: GuidelineSearchInput): Promise<GuidelineSearchResult[]>
	readDocument(input: GuidelineDocumentInput): Promise<GuidelineDocumentResult | null>
}
