import config from '@payload-config'
import { getPayload } from 'payload'
import type { PublishedImageProfileDefinition } from '@/features/image-generation/domain/image-studio-config'
import { isPayloadUser } from '@/lib/auth'

/** Image Studio가 Config를 파생할 수 있는 published 프로파일 정의만 조회한다. */
export async function listPublishedImageProfileDefinitions(
	user: unknown,
): Promise<PublishedImageProfileDefinition[]> {
	if (!isPayloadUser(user)) {
		throw new Error('Authenticated image profile consumer is required.')
	}
	const payload = await getPayload({ config })
	const profiles = await payload.find({
		collection: 'image-profiles',
		depth: 0,
		draft: false,
		limit: 100,
		// worker에게 숨긴 모델은 Service Base Definition 파생에만 쓰고 projector가 반환에서 제거한다.
		overrideAccess: true,
		select: {
			controllerRestrictions: true,
			controllerPresentation: true,
			features: true,
			imageModelPreset: true,
			name: true,
			output: true,
			slug: true,
		} as never,
		sort: 'displayOrder',
		user: user as never,
		where: { _status: { equals: 'published' } },
	})

	return profiles.docs.map((document) => {
		const {
			id,
			name,
			slug,
			imageModelPreset,
			controllerRestrictions,
			controllerPresentation,
			features,
			output,
		} = document as typeof document & {
			controllerRestrictions?: unknown
			controllerPresentation?: unknown
			features?: unknown
		}
		return {
			id,
			name,
			slug: slug || null,
			imageModelPreset,
			controllerRestrictions,
			controllerPresentation,
			features,
			output,
		}
	})
}
