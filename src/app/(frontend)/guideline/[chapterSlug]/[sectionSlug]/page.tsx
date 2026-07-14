import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { GuidelineSection } from '@/features/guideline/components/pages/guideline-section'
import { getGuidelineSectionPreview } from '@/features/guideline/services/get-guideline-document-preview.service'
import { getGuidelineSection } from '@/features/guideline/services/get-guideline-section.service'
import { isManager, isPayloadUser } from '@/lib/auth'
import { authenticateRequest } from '@/lib/request-auth'

export default async function GuidelineSectionPage({
	params,
	searchParams,
}: {
	params: Promise<{ chapterSlug: string; sectionSlug: string }>
	searchParams: Promise<{ previewDocument?: string }>
}) {
	const { chapterSlug, sectionSlug } = await params
	const previewDocumentId = Number((await searchParams).previewDocument)
	const previewSection = await getAuthorizedPreview(previewDocumentId)
	const section = previewSection ?? (await getGuidelineSection(chapterSlug, sectionSlug))

	if (!section) {
		notFound()
	}

	return (
		<GuidelineSection
			section={section}
			previewDocumentId={previewSection ? previewDocumentId : undefined}
		/>
	)
}

async function getAuthorizedPreview(documentId: number) {
	const { isEnabled } = await draftMode()

	if (!isEnabled || !Number.isSafeInteger(documentId) || documentId < 1) return null

	const { user } = await authenticateRequest()

	if (!isPayloadUser(user) || !isManager(user)) return null

	return getGuidelineSectionPreview(documentId, user)
}
