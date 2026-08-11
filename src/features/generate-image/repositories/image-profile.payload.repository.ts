import config from '@payload-config'
import { getPayload } from 'payload'
import type { ImageModelPreset } from '@/features/generate-image/image-model'
import type { ImageAspectRatio, ImageOutputSize } from '@/features/generate-image/image-size'
import type { ImageProfile } from '@/payload-types'

/**
 * 스튜디오 편집 계약을 파생할 수 있는 만큼만 담은 published 프로파일 정의.
 * 시스템 프롬프트(profilePrompt)와 정규화 후보는 절대 포함하지 않는다 — 브랜드 프롬프트는
 * 서버 전용 자산이고, 이 타입은 클라이언트까지 내려간다.
 */
export type PublishedImageProfileDefinition = {
	id: number
	name: string
	slug: string | null
	imageModelPreset: ImageModelPreset
	aspectRatio: ImageAspectRatio
	imageSize: ImageOutputSize
}

/** 스튜디오가 선택할 수 있는 published 프로파일의 정의 필드만 조회한다. */
export async function listPublishedImageProfileDefinitions(
	user: unknown,
): Promise<PublishedImageProfileDefinition[]> {
	const payload = await getPayload({ config })
	const profiles = await payload.find({
		collection: 'image-profiles',
		depth: 0,
		draft: false,
		limit: 100,
		overrideAccess: false,
		select: {
			aspectRatio: true,
			imageModelPreset: true,
			imageSize: true,
			name: true,
			slug: true,
		},
		sort: 'displayOrder',
		user: user as never,
		where: { _status: { equals: 'published' } },
	})

	return profiles.docs.map(({ id, name, slug, imageModelPreset, aspectRatio, imageSize }) => ({
		id,
		name,
		slug: slug || null,
		imageModelPreset,
		aspectRatio,
		imageSize,
	}))
}

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
