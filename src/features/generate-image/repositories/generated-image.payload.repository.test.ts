import { getPayload } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { storeGeneratedImages } from './generated-image.payload.repository'

const ONE_PIXEL_PNG =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('GeneratedImage repository', () => {
	const create = vi.fn()
	const remove = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(getPayload).mockResolvedValue({
			create,
			delete: remove,
		} as never)
	})

	it('생성 파일과 실행 메타데이터를 published 문서로 저장한다', async () => {
		create.mockResolvedValue({
			createdAt: '2026-07-31T03:00:00.000Z',
			id: 8,
			url: '/api/generated-images/file/generated.png',
		})

		await expect(
			storeGeneratedImages({
				createdBy: 1,
				effectivePrompt: '{"subject":"파란 세럼병"}',
				images: [ONE_PIXEL_PNG],
				inputPrompt: '파란 세럼병',
				model: 'gpt-image-2',
				profile: {
					aspectRatio: '3:2',
					id: 5,
					imageSize: '2K',
					name: '제품 이미지',
				},
			}),
		).resolves.toEqual([
			{
				collection: 'generated-images',
				createdAt: '2026-07-31T03:00:00.000Z',
				id: 8,
				url: '/api/generated-images/file/generated.png',
			},
		])
		expect(create).toHaveBeenCalledWith({
			collection: 'generated-images',
			data: {
				_status: 'published',
				aspectRatio: '3:2',
				createdBy: 1,
				effectivePrompt: '{"subject":"파란 세럼병"}',
				imageSize: '2K',
				inputPrompt: '파란 세럼병',
				model: 'gpt-image-2',
				scenario: 5,
				scenarioName: '제품 이미지',
			},
			draft: false,
			file: {
				data: expect.any(Buffer),
				mimetype: 'image/png',
				name: expect.stringMatching(/^generated-[\w-]+\.png$/),
				size: expect.any(Number),
			},
			overrideAccess: true,
		})
	})

	it('저장 중 실패하면 이번 요청에서 만든 문서를 정리한다', async () => {
		create
			.mockResolvedValueOnce({
				createdAt: '2026-07-31T03:00:00.000Z',
				id: 8,
				url: '/api/generated-images/file/generated.png',
			})
			.mockRejectedValueOnce(new Error('storage failed'))

		await expect(
			storeGeneratedImages({
				createdBy: 1,
				effectivePrompt: 'effective',
				images: [ONE_PIXEL_PNG, ONE_PIXEL_PNG],
				inputPrompt: 'input',
				model: 'gpt-image-2',
				profile: {
					aspectRatio: '1:1',
					id: 5,
					imageSize: '1K',
					name: '제품 이미지',
				},
			}),
		).rejects.toThrow('storage failed')
		expect(remove).toHaveBeenCalledWith({
			collection: 'generated-images',
			id: 8,
			overrideAccess: true,
		})
	})

	it('MIME과 실제 이미지 형식이 다른 생성 결과를 저장하지 않는다', async () => {
		await expect(
			storeGeneratedImages({
				createdBy: 1,
				effectivePrompt: 'effective',
				images: ['data:image/png;base64,aGVsbG8='],
				inputPrompt: 'input',
				model: 'gpt-image-2',
				profile: {
					aspectRatio: '1:1',
					id: 5,
					imageSize: '1K',
					name: '제품 이미지',
				},
			}),
		).rejects.toThrow()
		expect(create).not.toHaveBeenCalled()
	})
})
