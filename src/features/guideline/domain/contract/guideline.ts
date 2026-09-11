import type { GuidelineDocument } from '@/payload-types'

export type GuidelineBlocks = GuidelineDocument['blocks']
export type GuidelineHeaderImage = GuidelineDocument['headerImage']

export interface GuidelineMetadataData {
	companyName: string
	documentTitle: string
	faviconHref: string | null
	issuedLabel: string | null
	primaryDarkHex: string | null
	primaryHex: string | null
}

export interface GuidelineChapterData {
	displayOrder: number
	id: number
	slug: string
	title: string
}

export interface GuidelineNavigationTopicData {
	chapterId: number | null
	id: number
	sections: { anchor: string; title: string }[]
	slug: string
	title: string
}

export interface GuidelineTopicData {
	blocks: GuidelineBlocks
	headerImage: GuidelineHeaderImage
	id: number
	title: string
}
