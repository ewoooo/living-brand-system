import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	authenticateRequest: vi.fn(),
	listImageStudioConfigs: vi.fn(),
	notFound: vi.fn(() => {
		throw new Error('NEXT_NOT_FOUND')
	}),
}))

vi.mock('next/navigation', () => ({ notFound: mocks.notFound }))
vi.mock('@/lib/request-auth', () => ({ authenticateRequest: mocks.authenticateRequest }))
vi.mock('@/features/image-generation/services/list-image-studio-configs.service', () => ({
	listImageStudioConfigs: mocks.listImageStudioConfigs,
}))

import GenerateImagePage from './page'

describe('GenerateImagePage', () => {
	it('로그인하지 않은 요청을 빈 프로파일 상태로 표시하지 않는다', async () => {
		mocks.authenticateRequest.mockResolvedValue({ user: null })

		await expect(GenerateImagePage()).rejects.toThrow('NEXT_NOT_FOUND')
		expect(mocks.notFound).toHaveBeenCalledOnce()
		expect(mocks.listImageStudioConfigs).not.toHaveBeenCalled()
	})
})
