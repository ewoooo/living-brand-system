import { generateText } from 'ai'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('ai', () => ({ generateText: vi.fn() }))
vi.mock('@ai-sdk/anthropic', () => ({
	anthropic: vi.fn((model: string) => ({ model })),
}))

describe('generateTextCandidate', () => {
	beforeEach(() => {
		vi.resetModules()
		vi.unstubAllEnvs()
		vi.stubEnv('DATABASE_URL', 'postgres://user:pass@localhost:5432/test')
		vi.stubEnv('PAYLOAD_SECRET', 'test-secret')
		vi.mocked(generateText).mockReset()
	})

	it('provider 모델을 호출하고 공백 응답을 정규화한다', async () => {
		vi.stubEnv('ANTHROPIC_API_KEY', 'test-key')
		vi.stubEnv('ANTHROPIC_MODEL', 'test-model')
		vi.mocked(generateText).mockResolvedValue({ text: '  후보 문구  ' } as never)
		const { generateTextCandidate } = await import('./text-generation.ai.repository')

		await expect(
			generateTextCandidate({ prompt: '봄 캠페인', system: '짧게 작성' }),
		).resolves.toBe('후보 문구')
		expect(generateText).toHaveBeenCalledWith({
			model: { model: 'test-model' },
			system: '짧게 작성',
			prompt: '봄 캠페인',
			temperature: 1,
		})
	})

	it('API key가 없으면 provider를 호출하지 않는다', async () => {
		vi.stubEnv('ANTHROPIC_API_KEY', '')
		const { generateTextCandidate } = await import('./text-generation.ai.repository')

		await expect(
			generateTextCandidate({ prompt: '봄 캠페인', system: '짧게 작성' }),
		).resolves.toBeNull()
		expect(generateText).not.toHaveBeenCalled()
	})
})
