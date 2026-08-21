import { notFound } from 'next/navigation'
import { GraphicGenerator } from '@/components/studio/graphic/graphic-generator'
import { StudioWorkspacePage } from '@/components/studio/shared/studio-workspace'
import { listGraphicStudioConfigs } from '@/features/graphic-generation/services/list-graphic-studio-configs.service'
import { requireUser } from '@/lib/request-auth'
import { getStudioGraphicRoute } from '@/lib/routes'

// 렌더링: 매 요청. 권한·미리보기 상태를 읽으므로 캐시하지 않는다.
// 🔴 방식을 선언으로 못박는다 — 추론에 맡기면 프로덕션에서만 드러나는 차이가 생긴다
//    (docs/05 「렌더링 캐시 무효화」).
export const dynamic = 'force-dynamic'

/**
 * 그래픽 프로파일 딥링크 — 이미지 스튜디오의 `[profileSlug]`와 같은 모양이다.
 *
 * 🔴 세그먼트는 runtime id다. `GraphicProfiles.runtime`이 `unique: true`라 프로파일과 런타임이
 * 1:1이고, runtime id는 코드가 소유하는 안정된 문자열이라 그 자체가 slug 역할을 한다 —
 * 별도 slug 컬럼을 두면 같은 정체성을 두 곳에 적는 것이 된다. 한 런타임에 여러 프로파일을
 * 허용하게 되면 이 전제가 깨지므로 그때 slug 컬럼이 필요해진다.
 */
export default async function GenerateGraphicProfilePage({
	params,
}: {
	params: Promise<{ profileSlug: string }>
}) {
	const { profileSlug } = await params
	const { user } = await requireUser(getStudioGraphicRoute(profileSlug))

	const configs = await listGraphicStudioConfigs(user)
	const config = configs.find((item) => item.id === profileSlug)

	if (!config) notFound()

	return (
		<StudioWorkspacePage
			title={config.name}
			description="그래픽 도구의 설정을 조정하고 결과를 미리 봅니다."
			hideHeading
		>
			{/* 슬러그는 시작 프로파일만 정한다 — 교체는 세션을 유지하려고 클라이언트에서 처리한다. */}
			<GraphicGenerator config={config} />
		</StudioWorkspacePage>
	)
}
