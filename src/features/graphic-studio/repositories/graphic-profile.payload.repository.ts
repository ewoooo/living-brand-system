import config from '@payload-config'
import { getPayload } from 'payload'
import type { PublishedGraphicProfileDefinition } from '@/features/graphic-studio/graphic-studio-config'
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
		select: { controller: true, name: true, runtime: true },
		sort: 'displayOrder',
		user,
		where: { _status: { equals: 'published' } },
	})

	return profiles.docs.map(({ id, name, runtime, controller }) => ({
		id,
		name,
		runtime,
		controller,
	}))
}
