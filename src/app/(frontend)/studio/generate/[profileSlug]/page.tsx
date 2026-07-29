import { notFound } from 'next/navigation'
import { StudioWorkspacePage } from '@/components/studio/studio-workspace'
import { ImageGenerator } from '@/features/image-generation/components/image-generator'
import { listAvailableImageProfiles } from '@/features/image-generation/services/list-image-profiles.service'
import { authenticateRequest } from '@/lib/request-auth'

export default async function GenerateProfilePage({
	params,
}: {
	params: Promise<{ profileSlug: string }>
}) {
	const { profileSlug } = await params
	const { user } = await authenticateRequest()

	if (!user) notFound()

	const profiles = await listAvailableImageProfiles(user)
	const profile = profiles.find((item) => item.slug === profileSlug)

	if (!profile) notFound()

	return (
		<StudioWorkspacePage
			title={profile.name}
			description="선택한 이미지 프로파일을 적용해 브랜드 이미지 후보를 만듭니다."
		>
			<ImageGenerator profiles={profiles} initialProfileId={profile.id} />
		</StudioWorkspacePage>
	)
}
