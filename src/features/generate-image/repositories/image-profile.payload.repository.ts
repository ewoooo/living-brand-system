import config from '@payload-config'
import { getPayload } from 'payload'
import type { ImageModelPreset } from '@/features/generate-image/image-model'
import type { ImageAspectRatio, ImageOutputSize } from '@/features/generate-image/image-size'
import { isPayloadUser } from '@/lib/auth'
import type { ImageProfile } from '@/payload-types'

/**
 * 스튜디오 편집 계약을 파생할 수 있는 만큼만 담은 서버측 published 프로파일 정의.
 * imageModelPreset은 capability 계산에만 쓰고, 클라이언트에는 이 원본이 아니라
 * deriveImageStudioConfig가 제거·정규화한 결과만 내려간다.
 */
export type PublishedImageProfileDefinition = {
	id: number
	name: string
	slug: string | null
	imageModelPreset: ImageModelPreset
	aspectRatio: ImageAspectRatio
	imageSize: ImageOutputSize
	maxPromptLength?: number | null
	cameraControl?: boolean | null
	colorAdjustment?: { line?: string | null; background?: string | null } | null
	/** Payload 저작 형태. projector가 key/blockType을 공통 id/kind로 바꾸고 내부 row id를 버린다. */
	controller?: unknown
	/** Payload feature blocks. projector가 capability와 semantic control ref만 공개한다. */
	features?: unknown
	output?: { allowedFormats?: readonly string[] | null; original?: boolean | null } | null
}

/** 스튜디오가 선택할 수 있는 published 프로파일의 정의 필드만 조회한다. */
export async function listPublishedImageProfileDefinitions(
	user: unknown,
): Promise<PublishedImageProfileDefinition[]> {
	assertImageProfileConsumer(user)
	const payload = await getPayload({ config })
	const profiles = await payload.find({
		collection: 'image-profiles',
		depth: 0,
		draft: false,
		limit: 100,
		// worker에게 숨긴 모델은 legacy capability 파생에만 쓰고 projector가 반환에서 제거한다.
		overrideAccess: true,
		select: {
			aspectRatio: true,
			cameraControl: true,
			colorAdjustment: true,
			controller: true,
			features: true,
			imageModelPreset: true,
			imageSize: true,
			maxPromptLength: true,
			output: true,
			name: true,
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
			aspectRatio,
			imageSize,
			maxPromptLength,
			cameraControl,
			colorAdjustment,
			controller,
			features,
			output,
		} = document as typeof document & { controller?: unknown; features?: unknown }
		return {
			id,
			name,
			slug: slug || null,
			imageModelPreset,
			aspectRatio,
			imageSize,
			maxPromptLength,
			cameraControl,
			colorAdjustment,
			controller,
			features,
			output,
		}
	})
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
