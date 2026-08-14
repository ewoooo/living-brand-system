import { randomUUID } from 'node:crypto'
import config from '@payload-config'
import { getPayload } from 'payload'
import type { ImageAspectRatio, ImageOutputSize } from '@/features/image-generation/image-size'
import type { ImageProfile } from '@/payload-types'
import { decodeImageDataUri, MAX_IMAGE_BYTES, validateRasterImage } from '../image-data-uri'

export interface StoredGeneratedImage {
	collection: 'generated-images'
	createdAt: string
	id: number
	url: string
}

export interface GeneratedImageSeed {
	data: Buffer
	effectivePrompt: string
	inputPrompt: string
}

/**
 * 카메라 조정에 사용할 published Generated Image를 사용자 권한으로 찾고 원본 파일을 읽는다.
 * Payload 조회와 저장 URL 다운로드 I/O는 이 repository가 소유한다.
 */
export async function loadGeneratedImage(input: {
	generatedImageId: number
	profileId: number
	requestUrl: string
	user: unknown
}): Promise<GeneratedImageSeed | null> {
	const userId = getUserId(input.user)
	if (!userId) return null
	const payload = await getPayload({ config })
	const found = await payload.find({
		collection: 'generated-images',
		depth: 0,
		draft: false,
		limit: 1,
		overrideAccess: true,
		select: {
			effectivePrompt: true,
			filename: true,
			filesize: true,
			inputPrompt: true,
			url: true,
		},
		where: {
			and: [
				{ id: { equals: input.generatedImageId } },
				{ scenario: { equals: input.profileId } },
				{ createdBy: { equals: userId } },
				{ _status: { equals: 'published' } },
			],
		},
	})
	const image = found.docs[0]
	if (
		!image?.url ||
		typeof image.effectivePrompt !== 'string' ||
		typeof image.inputPrompt !== 'string' ||
		typeof image.filesize !== 'number' ||
		image.filesize <= 0 ||
		image.filesize > MAX_IMAGE_BYTES
	) {
		return null
	}

	const response = await fetch(new URL(image.url, input.requestUrl))
	if (!response.ok || !response.body) throw new Error('Stored generated image is unavailable.')

	const chunks: Uint8Array[] = []
	let size = 0
	const reader = response.body.getReader()
	while (true) {
		const { done, value } = await reader.read()
		if (done) break
		size += value.byteLength
		if (size > MAX_IMAGE_BYTES) {
			await reader.cancel()
			throw new Error('Stored generated image is too large.')
		}
		chunks.push(value)
	}

	return {
		data: (
			await validateRasterImage(
				Buffer.concat(chunks, size),
				response.headers.get('content-type'),
			)
		).data,
		effectivePrompt: image.effectivePrompt,
		inputPrompt: image.inputPrompt,
	}
}

function getUserId(user: unknown): number | null {
	const id = typeof user === 'object' && user !== null && 'id' in user ? user.id : null
	return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : null
}

/**
 * 프로파일 기반 생성 결과를 공개 가능한 Generated Images 파일로 저장한다.
 * Payload upload와 실패 시 부분 생성 파일 정리는 이 repository가 소유한다.
 */
export async function storeGeneratedImages(input: {
	createdBy: number
	effectivePrompt: string
	images: readonly string[]
	inputPrompt: string
	model: string
	profile: Pick<ImageProfile, 'id' | 'name'> & {
		aspectRatio: ImageAspectRatio
		imageSize: ImageOutputSize
	}
}): Promise<StoredGeneratedImage[]> {
	const payload = await getPayload({ config })
	const createdIds: number[] = []

	try {
		const stored: StoredGeneratedImage[] = []
		for (const image of input.images) {
			const file = await decodeImageDataUri(image)
			const created = await payload.create({
				collection: 'generated-images',
				data: {
					_status: 'published',
					aspectRatio: input.profile.aspectRatio,
					createdBy: input.createdBy,
					effectivePrompt: input.effectivePrompt,
					imageSize: input.profile.imageSize,
					inputPrompt: input.inputPrompt,
					model: input.model,
					scenario: input.profile.id,
					scenarioName: input.profile.name,
				},
				draft: false,
				file: {
					data: file.data,
					mimetype: file.mimeType,
					name: `generated-${randomUUID()}.${file.extension}`,
					size: file.data.byteLength,
				},
				overrideAccess: true,
			})
			createdIds.push(created.id)
			if (!created.url) throw new Error('Stored generated image has no URL.')
			stored.push({
				collection: 'generated-images',
				createdAt: created.createdAt,
				id: created.id,
				url: created.url,
			})
		}
		return stored
	} catch (error) {
		await Promise.allSettled(
			createdIds.map((id) =>
				payload.delete({
					collection: 'generated-images',
					id,
					overrideAccess: true,
				}),
			),
		)
		throw error
	}
}
