import { notFound } from 'next/navigation'
import { ImageGenerator } from '@/components/studio/generate/image-generator'
import { StudioWorkspacePage } from '@/components/studio/studio-workspace'
import { listPublishedImageProfiles } from '@/features/generate-image/repositories/image-profile.payload.repository'
import { authenticateRequest } from '@/lib/request-auth'

export default async function GenerateImageProfilePage({
	params,
}: {
	params: Promise<{ profileSlug: string }>
}) {
	const { profileSlug } = await params
	const { user } = await authenticateRequest()

	if (!user) notFound()

	const profiles = await listPublishedImageProfiles(user)
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
