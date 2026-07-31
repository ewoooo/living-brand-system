import { redirect } from 'next/navigation'
import { getStudioGenerateProfileRoute } from '@/lib/routes'

export default async function LegacyGenerateProfilePage({
	params,
}: {
	params: Promise<{ profileSlug: string }>
}) {
	const { profileSlug } = await params
	redirect(getStudioGenerateProfileRoute(profileSlug))
}
