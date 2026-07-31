import { getPayload } from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_IMAGE_BYTES } from '../image-data-uri'
import { loadGeneratedImage, storeGeneratedImages } from './generated-image.payload.repository'

const ONE_PIXEL_PNG =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('GeneratedImage repository', () => {
	const create = vi.fn()
	const fetchImage = vi.fn()
	const find = vi.fn()
	const remove = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
		vi.stubGlobal('fetch', fetchImage)
		vi.mocked(getPayload).mockResolvedValue({
			create,
			delete: remove,
			find,
		} as never)
	})

	afterEach(() => vi.unstubAllGlobals())

	it('published 생성 이미지 ID와 프로파일을 확인해 저장 원본을 읽는다', async () => {
		const data = Buffer.from(ONE_PIXEL_PNG.split(',')[1] ?? '', 'base64')
		find.mockResolvedValue({
			docs: [
				{
					filesize: data.byteLength,
					url: '/api/generated-images/file/generated.png',
				},
			],
		})
		fetchImage.mockResolvedValue(
			new Response(data, { headers: { 'Content-Type': 'image/png' } }),
		)
		const user = { id: 1 }

		await expect(
			loadGeneratedImage({
				generatedImageId: 8,
				profileId: 5,
				requestUrl: 'http://localhost/api/generate-image/camera-adjustment',
				user,
			}),
		).resolves.toEqual(data)
		expect(find).toHaveBeenCalledWith({
			collection: 'generated-images',
			depth: 0,
			draft: false,
			limit: 1,
			overrideAccess: false,
			select: { filesize: true, url: true },
			user,
			where: {
				and: [
					{ id: { equals: 8 } },
					{ scenario: { equals: 5 } },
					{ _status: { equals: 'published' } },
				],
			},
		})
		expect(String(fetchImage.mock.calls[0]?.[0])).toBe(
			'http://localhost/api/generated-images/file/generated.png',
		)
	})

	it('조회할 수 없거나 크기 상한을 넘은 생성 이미지는 다운로드하지 않는다', async () => {
		find.mockResolvedValueOnce({ docs: [] }).mockResolvedValueOnce({
			docs: [
				{
					filesize: MAX_IMAGE_BYTES + 1,
					url: '/api/generated-images/file/generated.png',
				},
			],
		})
		const input = {
			generatedImageId: 8,
			profileId: 5,
			requestUrl: 'http://localhost/api/generate-image/camera-adjustment',
			user: { id: 1 },
		}

		await expect(loadGeneratedImage(input)).resolves.toBeNull()
		await expect(loadGeneratedImage(input)).resolves.toBeNull()
		expect(fetchImage).not.toHaveBeenCalled()
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
