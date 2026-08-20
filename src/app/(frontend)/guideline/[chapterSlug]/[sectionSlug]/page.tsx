import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { ContentFrame } from '@/components/shared/content-frame'
import { GuidelineSection } from '@/features/guideline/components/pages/guideline-section'
import { getGuidelineSectionPreview } from '@/features/guideline/services/get-guideline-document-preview.service'
import { getGuidelineSection } from '@/features/guideline/services/get-guideline-section.service'
// 🔴 임시(개발용) import — 아래 slug 분기와 함께 지운다.
import { CiLockupWidget } from '@/features/guideline/widgets/ci-lockup/component'
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
		<>
			<GuidelineSection
				section={section}
				previewDocumentId={previewSection ? previewDocumentId : undefined}
			/>
			{/* 🔴 임시(개발용) — CI 락업 위젯을 실제 페이지에서 보려고 slug로 끼워 넣었다.
			    위젯에 schema.ts가 없어 admin으로 넣을 수 없는 동안만 쓴다.
			    등록 3곳(`docs/11` §3)을 마치면 이 조각을 통째로 지운다. 커밋에 남기지 말 것. */}
			{sectionSlug === 'subsidiary-ci' && (
				<ContentFrame>
					<CiLockupWidget />
				</ContentFrame>
			)}
		</>
	)
}

async function getAuthorizedPreview(documentId: number) {
	const { isEnabled } = await draftMode()

	if (!isEnabled || !Number.isSafeInteger(documentId) || documentId < 1) return null

	const { user } = await authenticateRequest()

	if (!isPayloadUser(user) || !isManager(user)) return null

	return getGuidelineSectionPreview(documentId, user)
}
