import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { GuidelineSection } from '@/features/guideline/components/pages/guideline-section'
import { getGuidelinePagePreview } from '@/features/guideline/services/get-guideline-page-preview.service'
import { getGuidelineSection } from '@/features/guideline/services/get-guideline-section.service'
import { isManager, isPayloadUser } from '@/lib/auth'
import { authenticateRequest } from '@/lib/request-auth'

export default async function GuidelineSectionPage({
	params,
	searchParams,
}: {
	params: Promise<{ chapterSlug: string; sectionSlug: string }>
	searchParams: Promise<{ previewPage?: string }>
}) {
	const { chapterSlug, sectionSlug } = await params
	const previewSection = await getAuthorizedPreview((await searchParams).previewPage)
	const section = previewSection ?? (await getGuidelineSection(chapterSlug, sectionSlug))

	if (!section) {
		notFound()
	}

	return <GuidelineSection section={section} isPreview={Boolean(previewSection)} />
}

async function getAuthorizedPreview(previewPage?: string) {
	const pageId = Number(previewPage)
	const { isEnabled } = await draftMode()

	if (!isEnabled || !Number.isSafeInteger(pageId) || pageId < 1) return null

	const { user } = await authenticateRequest()

	if (!isPayloadUser(user) || !isManager(user)) return null

	return getGuidelinePagePreview(pageId, user)
}
