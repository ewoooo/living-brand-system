import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listPublishedTemplates } from '@/features/asset-generation/repositories/published-template.payload.repository'
import { getPublishedTemplates } from '@/features/asset-generation/services/get-published-templates.service'

vi.mock('@/features/asset-generation/repositories/published-template.payload.repository', () => ({
	listPublishedTemplates: vi.fn(),
}))

const mockedList = vi.mocked(listPublishedTemplates)

const validJsonTemplate = {
	width: 1080,
	height: 1350,
	background: '#ffffff',
	elements: [],
}

describe('getPublishedTemplates', () => {
	beforeEach(() => {
		mockedList.mockReset()
	})

	it('스키마에 맞는 템플릿만 돌려준다', async () => {
		mockedList.mockResolvedValue([
			{ id: 1, name: '정상 템플릿', jsonTemplate: validJsonTemplate },
			{ id: 2, name: '손으로 고치다 깨진 템플릿', jsonTemplate: { width: 'broken' } },
			{ id: 3, name: 'jsonTemplate 없음', jsonTemplate: null },
		] as never)

		const templates = await getPublishedTemplates()

		expect(templates).toHaveLength(1)
		expect(templates[0]).toMatchObject({ id: 1, name: '정상 템플릿' })
	})

	it('조회 실패 시 빈 목록으로 폴백한다', async () => {
		mockedList.mockRejectedValue(new Error('db down'))

		await expect(getPublishedTemplates()).resolves.toEqual([])
	})
})
