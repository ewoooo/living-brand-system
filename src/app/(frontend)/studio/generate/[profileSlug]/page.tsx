import { redirect } from 'next/navigation'
import { getStudioGenerateProfileRoute } from '@/lib/routes'

// 렌더링: 매 요청. 권한·미리보기 상태를 읽으므로 캐시하지 않는다.
// 🔴 방식을 선언으로 못박는다 — 추론에 맡기면 프로덕션에서만 드러나는 차이가 생긴다
//    (docs/05 「렌더링 캐시 무효화」).
export const dynamic = 'force-dynamic'

export default async function LegacyGenerateProfilePage({
	params,
}: {
	params: Promise<{ profileSlug: string }>
}) {
	const { profileSlug } = await params
	redirect(getStudioGenerateProfileRoute(profileSlug))
}
