import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	findGuidelineMetadataGlobal,
	findPublishedChapterBySlug,
	findPublishedTopicBySlug,
	listPublishedGuidelineNavigationDocuments,
	listPublishedTopicsByChapter,
} from '../repositories/guideline-view.payload.repository'
import { getGuidelineChapter } from './get-guideline-chapter.service'
import { getGuidelineMetadata } from './get-guideline-metadata.service'
import { getGuidelineNavigation } from './get-guideline-navigation.service'
import { getGuidelineTopic } from './get-guideline-topic.service'

vi.mock('../repositories/guideline-view.payload.repository', () => ({
	findGuidelineMetadataGlobal: vi.fn(),
	findPublishedChapterBySlug: vi.fn(),
	findPublishedTopicBySlug: vi.fn(),
	listPublishedGuidelineNavigationDocuments: vi.fn(),
	listPublishedTopicsByChapter: vi.fn(),
}))

const chapter = {
	id: 1,
	title: 'Brand',
	label: null,
	description: null,
}

describe('guideline read service failures', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		vi.mocked(findGuidelineMetadataGlobal).mockResolvedValue({
			companyName: 'Company',
			documentTitle: 'Guideline',
			faviconHref: null,
			issuedLabel: null,
			primaryHex: null,
			primaryDarkHex: null,
		})
		vi.mocked(listPublishedGuidelineNavigationDocuments).mockResolvedValue([])
	})

	it('chapter 미존재는 null이고 하위 목록 조회 실패는 전파한다', async () => {
		vi.mocked(findPublishedChapterBySlug).mockResolvedValueOnce(null as never)
		await expect(getGuidelineChapter('missing')).resolves.toBeNull()

		vi.mocked(findPublishedChapterBySlug).mockResolvedValueOnce(chapter as never)
		vi.mocked(listPublishedTopicsByChapter).mockRejectedValueOnce(new Error('db down'))
		await expect(getGuidelineChapter('brand')).rejects.toThrow('db down')
	})

	it('topic 미존재는 null이고 본문 조회 실패는 전파한다', async () => {
		vi.mocked(findPublishedChapterBySlug).mockResolvedValue(chapter as never)
		vi.mocked(findPublishedTopicBySlug).mockResolvedValueOnce(null as never)
		await expect(getGuidelineTopic('brand', 'missing')).resolves.toBeNull()

		vi.mocked(findPublishedTopicBySlug).mockRejectedValueOnce(new Error('db down'))
		await expect(getGuidelineTopic('brand', 'logo')).rejects.toThrow('db down')
	})

	it('metadata 조회 실패를 가짜 기본값으로 숨기지 않는다', async () => {
		vi.mocked(findGuidelineMetadataGlobal).mockRejectedValueOnce(new Error('db down'))

		await expect(getGuidelineMetadata()).rejects.toThrow('db down')
	})

	it('빈 문서 목록은 빈 navigation이고 조회 실패는 전파한다', async () => {
		await expect(getGuidelineNavigation()).resolves.toMatchObject({
			title: 'Guideline',
			chapters: [],
		})

		vi.mocked(listPublishedGuidelineNavigationDocuments).mockRejectedValueOnce(
			new Error('db down'),
		)
		await expect(getGuidelineNavigation()).rejects.toThrow('db down')
	})
})
