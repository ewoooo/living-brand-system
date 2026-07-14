import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { GuidelineChapter } from '@/features/guideline/components/pages/guideline-chapter'
import { getGuidelineChapter } from '@/features/guideline/services/get-guideline-chapter.service'
import { getGuidelineChapterPreview } from '@/features/guideline/services/get-guideline-document-preview.service'
import { isManager, isPayloadUser } from '@/lib/auth'
import { authenticateRequest } from '@/lib/request-auth'

export default async function GuidelineChapterPage({
	params,
	searchParams,
}: {
	params: Promise<{ chapterSlug: string }>
	searchParams: Promise<{ previewDocument?: string }>
}) {
	const { chapterSlug } = await params
	const previewChapter = await getAuthorizedPreview((await searchParams).previewDocument)
	const chapter = previewChapter ?? (await getGuidelineChapter(chapterSlug))

	if (!chapter) {
		notFound()
	}

	return <GuidelineChapter chapter={chapter} chapterSlug={chapterSlug} />
}

async function getAuthorizedPreview(previewDocument?: string) {
	const documentId = Number(previewDocument)
	const { isEnabled } = await draftMode()

	if (!isEnabled || !Number.isSafeInteger(documentId) || documentId < 1) return null

	const { user } = await authenticateRequest()

	if (!isPayloadUser(user) || !isManager(user)) return null

	return getGuidelineChapterPreview(documentId, user)
}
