import { randomUUID } from 'node:crypto'
import config from '@payload-config'
import { getPayload } from 'payload'
import type { ImageProfile } from '@/payload-types'
import { decodeImageDataUri } from '../image-data-uri'

export interface StoredGeneratedImage {
	collection: 'generated-images'
	createdAt: string
	id: number
	url: string
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
	profile: Pick<ImageProfile, 'aspectRatio' | 'id' | 'imageSize' | 'name'>
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
