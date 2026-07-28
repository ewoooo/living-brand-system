import { listPublishedImageProfiles } from '@/features/image-generation/repositories/image-profile.payload.repository'
import { getStudioGenerateProfileRoute } from '@/lib/routes'

export interface ImageProfileNavigationItem {
	id: number
	name: string
	slug: string
	href: string
}

/** Creator와 Agent에 사용 가능한 published 이미지 프로파일 선택지를 제공한다. Payload 조회는 repository가 소유한다. */
export async function listAvailableImageProfiles(user: unknown) {
	return listPublishedImageProfiles(user)
}

/** Studio 사이드바가 published 이미지 프로파일을 URL 항목으로 표시하도록 변환한다. */
export async function getImageProfileNavigation(
	user: unknown,
): Promise<ImageProfileNavigationItem[]> {
	if (!user) return []

	const profiles = await listAvailableImageProfiles(user)

	return profiles.flatMap((profile) =>
		profile.slug
			? [
					{
						...profile,
						slug: profile.slug,
						href: getStudioGenerateProfileRoute(profile.slug),
					},
				]
			: [],
	)
}
