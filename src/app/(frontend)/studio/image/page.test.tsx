import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	requireUser: vi.fn(),
	listImageStudioConfigs: vi.fn(),
}))

vi.mock('@/lib/request-auth', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/features/image-generation/services/list-image-studio-configs.service', () => ({
	listImageStudioConfigs: mocks.listImageStudioConfigs,
}))

import GenerateImagePage from './page'

describe('GenerateImagePage', () => {
	it('로그인하지 않은 요청은 게이트에서 로그인으로 보내고 프로파일을 조회하지 않는다', async () => {
		mocks.requireUser.mockImplementation(() => {
			throw new Error('NEXT_REDIRECT')
		})

		await expect(GenerateImagePage()).rejects.toThrow('NEXT_REDIRECT')
		expect(mocks.requireUser).toHaveBeenCalledWith('/studio/image')
		expect(mocks.listImageStudioConfigs).not.toHaveBeenCalled()
	})
})
