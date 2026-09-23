import { redirect } from 'next/navigation'
import { StudioWorkspacePage } from '@/components/studio/shared/studio-workspace'
import { AiUsageView } from '@/components/studio/usage/ai-usage-view'
import { isManager, isPayloadUser } from '@/lib/auth'
import { requireUser } from '@/lib/request-auth'
import { getStudioUsageUserRoute } from '@/lib/routes'
import { parseAiUsageQuery } from '@/modules/ai-usage/ai-usage-query'
import { getAiUsageBreakdown } from '@/modules/ai-usage/services/get-ai-usage-breakdown.service'

// 렌더링: 매 요청. 로그인 계정에 따라 보이는 행이 달라지므로 캐시하지 않는다(docs/05).
export const dynamic = 'force-dynamic'

/**
 * 한 계정의 사용량 — 본인과 manager만 연다.
 *
 * 🔴 범위를 세그먼트가 갖는 것이 이 주소의 요점이다. 칩으로 두면 떼어낼 수 있어 경계가 아니다.
 * 🔑 계산은 전체 페이지와 같은 fold다 — 여기서 새로 집계하지 않는다.
 */
export default async function StudioUsageUserPage({
	params,
	searchParams,
}: {
	params: Promise<{ userId: string }>
	searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
	const { userId } = await params
	const path = getStudioUsageUserRoute(userId)
	const { user } = await requireUser(path)
	if (!isPayloadUser(user)) redirect(`/admin/login?redirect=${encodeURIComponent(path)}`)
	// 남의 페이지를 연 비-manager는 자기 페이지로 돌려보낸다 — 없는 계정인지 권한이 없는지
	// 구분해 알려 주지 않는다(docs/07 신뢰 경계).
	if (!isManager(user) && String(user.id) !== userId) redirect(getStudioUsageUserRoute(user.id))

	const query = parseAiUsageQuery(await searchParams)
	// 주소에 실려 온 계정 칩은 버린다 — 범위는 세그먼트가 갖고, 칩이 그것을 덮으면 안 된다.
	const filters = { ...query.filters }
	delete filters.user
	const { rows, todayKey } = await getAiUsageBreakdown(user)
	const email = rows.find((row) => String(row.userId) === userId)?.userEmail

	return (
		<StudioWorkspacePage description={email ?? '아직 기록이 없는 계정입니다.'} title="사용량">
			<AiUsageView
				query={{ ...query, filters }}
				rows={rows}
				scopedUserId={userId}
				todayKey={todayKey}
			/>
		</StudioWorkspacePage>
	)
}
