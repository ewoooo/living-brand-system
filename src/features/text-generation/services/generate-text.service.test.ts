import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateTextCandidate } from '@/features/text-generation/repositories/text-generation.ai.repository'
import { generateTextCandidates } from './generate-text.service'

vi.mock('@/features/text-generation/repositories/text-generation.ai.repository', () => ({
	generateTextCandidate: vi.fn(),
}))

describe('generateTextCandidates', () => {
	beforeEach(() => {
		vi.mocked(generateTextCandidate).mockReset()
	})

	it('후보를 병렬 요청하고 성공한 비어 있지 않은 결과만 유지한다', async () => {
		vi.mocked(generateTextCandidate)
			.mockResolvedValueOnce('첫 번째')
			.mockResolvedValueOnce(null)
			.mockRejectedValueOnce(new Error('provider failed'))

		await expect(
			generateTextCandidates({ prompt: '봄 캠페인', rule: '명사형 제목', count: 3 }),
		).resolves.toEqual(['첫 번째'])
		expect(generateTextCandidate).toHaveBeenCalledTimes(3)
		expect(generateTextCandidate).toHaveBeenCalledWith({
			prompt: '봄 캠페인',
			system: expect.stringContaining('제약(반드시 지킬 것): 명사형 제목'),
		})
	})

	it('rule이 없으면 제약 문구를 만들지 않는다', async () => {
		vi.mocked(generateTextCandidate).mockResolvedValue('후보')

		await generateTextCandidates({ prompt: '봄 캠페인', count: 1 })

		expect(generateTextCandidate).toHaveBeenCalledWith({
			prompt: '봄 캠페인',
			system: expect.not.stringContaining('제약(반드시 지킬 것)'),
		})
	})
})
