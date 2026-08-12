import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { GuidelineChapter } from '@/features/guideline/components/pages/guideline-chapter'
import { getGuidelineChapter } from '@/features/guideline/services/get-guideline-chapter.service'
import { getGuidelineChapterPreview } from '@/features/guideline/services/get-guideline-document-preview.service'
import { isManager, isPayloadUser } from '@/lib/auth'
import { authenticateRequest } from '@/lib/request-auth'

// 렌더링: 매 요청. 권한·미리보기 상태를 읽으므로 캐시하지 않는다.
// 🔴 방식을 선언으로 못박는다 — 추론에 맡기면 프로덕션에서만 드러나는 차이가 생긴다
//    (docs/05 「렌더링 캐시 무효화」).
export const dynamic = 'force-dynamic'

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

	return (
		<GuidelineChapter
			chapter={chapter}
			chapterSlug={chapterSlug}
			isPreview={Boolean(previewChapter)}
		/>
	)
}

async function getAuthorizedPreview(previewDocument?: string) {
	const documentId = Number(previewDocument)
	const { isEnabled } = await draftMode()

	if (!isEnabled || !Number.isSafeInteger(documentId) || documentId < 1) return null

	const { user } = await authenticateRequest()

	if (!isPayloadUser(user) || !isManager(user)) return null

	return getGuidelineChapterPreview(documentId, user)
}
