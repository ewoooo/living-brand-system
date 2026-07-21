import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { z } from 'zod'

const mocks = vi.hoisted(() => ({
	anthropic: vi.fn((model: string) => model),
	generateText: vi.fn(),
	object: vi.fn(({ schema }: { schema: z.ZodType }) => schema),
}))

vi.mock('@ai-sdk/anthropic', () => ({ anthropic: mocks.anthropic }))
vi.mock('ai', () => ({
	generateText: mocks.generateText,
	Output: { object: mocks.object },
}))
vi.mock('@/env', () => ({
	env: { ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_MODEL: 'test-model' },
}))

import { normalizeImagePromptWithAi } from './image-prompt-normalization.ai.repository'

describe('normalizeImagePromptWithAi', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.generateText.mockResolvedValue({ output: { mood: 'organic' } })
	})

	it('관리자가 정한 후보만 허용하는 구조화 출력 스키마를 사용한다', async () => {
		await expect(
			normalizeImagePromptWithAi('차분한 제품 이미지', [
				{
					key: 'mood',
					candidates: [{ value: 'organic' }, { value: 'confident' }],
				},
			]),
		).resolves.toEqual({ mood: 'organic' })

		const schema = mocks.object.mock.calls[0]?.[0]?.schema
		expect(schema.safeParse({ mood: 'organic' }).success).toBe(true)
		expect(schema.safeParse({ mood: 'not-allowed' }).success).toBe(false)
		expect(schema.safeParse({ mood: 'organic', extra: 'value' }).success).toBe(false)
	})
})
