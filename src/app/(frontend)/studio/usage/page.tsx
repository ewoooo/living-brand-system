import { redirect } from 'next/navigation'
import { StudioWorkspacePage } from '@/components/studio/shared/studio-workspace'
import { AiUsageView } from '@/components/studio/usage/ai-usage-view'
import { isManager, isPayloadUser } from '@/lib/auth'
import { requireUser } from '@/lib/request-auth'
import { getStudioUsageUserRoute, routes } from '@/lib/routes'
import { parseAiUsageQuery } from '@/modules/ai-usage/ai-usage-query'
import { getAiUsageBreakdown } from '@/modules/ai-usage/services/get-ai-usage-breakdown.service'

// 렌더링: 매 요청. 로그인 계정에 따라 보이는 행이 달라지므로 캐시하지 않는다(docs/05).
export const dynamic = 'force-dynamic'

/** 전체 총합 — **manager 전용**이다. 계정 축이 여기에만 있는 것이 이 주소의 존재 이유다. */
export default async function StudioUsagePage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
	const { user } = await requireUser(routes.studio.usage)
	// MCP API 키로는 이 화면을 열 수 없다 — 집계는 사람 계정 단위이므로 로그인으로 돌려보낸다.
	if (!isPayloadUser(user))
		redirect(`/admin/login?redirect=${encodeURIComponent(routes.studio.usage)}`)
	// 🔴 권한 경계가 주소에 드러난다. 나머지는 자기 페이지로 — 막지 않으면 남의 계정 목록이 샌다.
	if (!isManager(user)) redirect(getStudioUsageUserRoute(user.id))

	const query = parseAiUsageQuery(await searchParams)
	const { rows, todayKey } = await getAiUsageBreakdown(user)

	return (
		<StudioWorkspacePage description="모든 계정이 AI에 쓴 토큰입니다." title="사용량">
			<AiUsageView query={query} rows={rows} todayKey={todayKey} />
		</StudioWorkspacePage>
	)
}
