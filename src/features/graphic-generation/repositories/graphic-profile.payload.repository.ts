import config from '@payload-config'
import { getPayload } from 'payload'
import type { PublishedGraphicProfileDefinition } from '@/features/graphic-generation/domain/graphic-studio-config'
import { isPayloadUser } from '@/lib/auth'

/** 인증 사용자가 소비할 수 있는 published Graphic Profile의 안전한 계약 필드만 조회한다. */
export async function listPublishedGraphicProfileDefinitions(
	user: unknown,
): Promise<PublishedGraphicProfileDefinition[]> {
	if (!isPayloadUser(user)) throw new Error('Authenticated graphic profile consumer is required.')
	const payload = await getPayload({ config })
	const profiles = await payload.find({
		collection: 'graphic-profiles',
		depth: 0,
		draft: false,
		limit: 100,
		overrideAccess: false,
		select: {
			controllerRestrictions: true,
			controllerPresentation: true,
			name: true,
			output: true,
			runtime: true,
		} as never,
		sort: 'displayOrder',
		user,
		where: { _status: { equals: 'published' } },
	})

	return profiles.docs.map((document) => {
		const { id, name, runtime, controllerRestrictions, controllerPresentation, output } =
			document as typeof document & {
				controllerRestrictions?: unknown
				controllerPresentation?: unknown
				output?: PublishedGraphicProfileDefinition['output']
			}
		return {
			id,
			name,
			runtime,
			controllerRestrictions,
			controllerPresentation,
			output,
		}
	})
}
