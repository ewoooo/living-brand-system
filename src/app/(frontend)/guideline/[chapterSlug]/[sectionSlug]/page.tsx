import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { GuidelineSection } from '@/features/guideline/components/pages/guideline-section'
import { getGuidelineSectionPreview } from '@/features/guideline/services/get-guideline-document-preview.service'
import { getGuidelineSection } from '@/features/guideline/services/get-guideline-section.service'
import { isManager, isPayloadUser } from '@/lib/auth'
import { authenticateRequest } from '@/lib/request-auth'

// 렌더링: 매 요청. 권한·미리보기 상태를 읽으므로 캐시하지 않는다.
// 🔴 방식을 선언으로 못박는다 — 추론에 맡기면 프로덕션에서만 드러나는 차이가 생긴다
//    (docs/05 「렌더링 캐시 무효화」).
export const dynamic = 'force-dynamic'

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
