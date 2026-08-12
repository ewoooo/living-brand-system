import config from '@payload-config'
import { getPayload } from 'payload'
import { isPayloadUser } from '@/lib/auth'
import type { ImageProfile } from '@/payload-types'

export async function listPublishedImageProfiles(
	user: unknown,
): Promise<{ id: number; name: string; slug: string | null }[]> {
	const payload = await getPayload({ config })
	const profiles = await payload.find({
		collection: 'image-profiles',
		depth: 0,
		draft: false,
		limit: 100,
		overrideAccess: false,
		select: { name: true, slug: true },
		sort: 'displayOrder',
		user: user as never,
		where: { _status: { equals: 'published' } },
	})

	return profiles.docs.map(({ id, name, slug }) => ({ id, name, slug: slug || null }))
}

/** Creator와 Agent가 사용할 수 있는 published 프로파일만 사용자 권한으로 조회한다. */
export async function findPublishedImageProfile(
	user: unknown,
	profileId: number,
): Promise<ImageProfile | null> {
	assertImageProfileConsumer(user)
	const payload = await getPayload({ config })
	const profiles = await payload.find({
		collection: 'image-profiles',
		depth: 0,
		draft: false,
		limit: 1,
		// 생성 서비스가 모델·시스템 프롬프트를 읽는 trusted server 경로다.
		overrideAccess: true,
		user: user as never,
		where: {
			and: [{ id: { equals: profileId } }, { _status: { equals: 'published' } }],
		},
	})

	return profiles.docs[0] ?? null
}

function assertImageProfileConsumer(user: unknown) {
	if (!isPayloadUser(user)) {
		throw new Error('Authenticated image profile consumer is required.')
	}
}
