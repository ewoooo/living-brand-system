import type { GuidelinePage, Section } from '@/payload-types'

export interface GuidelineSearchInput {
	query: string
}

export type GuidelineDocumentCollection = 'guideline-pages' | 'sections'

export interface GuidelineSearchResult {
	title: string
	collection: string
	id: string
}

export interface GuidelinePageListResult {
	title: string
	pages: {
		id: string
		title: string
	}[]
}

export type AgentGuidelinePage = Pick<
	GuidelinePage,
	'id' | 'title' | 'slug' | 'description' | 'blocks' | 'rules' | 'section'
>

export type AgentGuidelineSection = Pick<Section, 'id' | 'title' | 'slug' | 'description'>

export type AgentGuidelinePageSummary = Pick<GuidelinePage, 'id' | 'title' | 'slug' | 'description'>

export interface AgentGuidelineContextRepository {
	findPage(id: string): Promise<AgentGuidelinePage | null>
	findSection(id: string): Promise<AgentGuidelineSection | null>
	listPages(): Promise<GuidelinePageListResult[]>
	listSectionPages(sectionId: number): Promise<AgentGuidelinePageSummary[]>
	search(input: GuidelineSearchInput): Promise<GuidelineSearchResult[]>
}
