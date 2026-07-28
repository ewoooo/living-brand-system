import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/global/page-header'
import { GuidelineContentFrame } from '@/features/guideline/components/guideline-content-frame'
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
		<GuidelineContentFrame className="flex flex-col gap-8 py-10">
			<PageHeader title={profile.name} />
			<ImageGenerator profiles={profiles} initialProfileId={profile.id} />
		</GuidelineContentFrame>
	)
}
