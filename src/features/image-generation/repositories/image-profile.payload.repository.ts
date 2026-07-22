import config from '@payload-config'
import { getPayload } from 'payload'
import type { ImageProfile } from '@/payload-types'

/** Creator와 Agent가 사용할 수 있는 published 프로파일만 사용자 권한으로 조회한다. */
export async function findPublishedImageProfile(
	user: unknown,
	profileId: number,
): Promise<ImageProfile | null> {
	const payload = await getPayload({ config })
	const profiles = await payload.find({
		collection: 'image-profiles',
		depth: 0,
		draft: false,
		limit: 1,
		overrideAccess: false,
		user: user as never,
		where: {
			and: [{ id: { equals: profileId } }, { _status: { equals: 'published' } }],
		},
	})

	return profiles.docs[0] ?? null
}
