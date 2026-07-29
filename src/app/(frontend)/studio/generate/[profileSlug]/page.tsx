import { notFound } from 'next/navigation'
import { ContentFrame } from '@/components/shared/content-frame'
import { ContentHeading } from '@/components/shared/content-heading'
import { ImageGenerator } from '@/components/studio/generate/image-generator'
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
		<ContentFrame
			variant="full"
			className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] py-0"
		>
			<ContentHeading
				title={profile.name}
				description="선택한 이미지 프로파일을 적용해 브랜드 이미지 후보를 만듭니다."
				className="px-4 py-6 md:px-8"
			/>
			<ImageGenerator profiles={profiles} initialProfileId={profile.id} />
		</ContentFrame>
	)
}
