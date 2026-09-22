import { redirect } from 'next/navigation'
import { StudioWorkspacePage } from '@/components/studio/shared/studio-workspace'
import { AiUsageTotalsTable } from '@/components/studio/usage/ai-usage-totals-table'
import { isManager, isPayloadUser } from '@/lib/auth'
import { requireUser } from '@/lib/request-auth'
import { routes } from '@/lib/routes'
import { getAiUsageTotals } from '@/modules/ai-usage/services/get-ai-usage-totals.service'

// 렌더링: 매 요청. 로그인 계정에 따라 보이는 행이 달라지므로 캐시하지 않는다(docs/05).
export const dynamic = 'force-dynamic'

export default async function StudioUsagePage() {
	const { user } = await requireUser(routes.studio.usage)
	// MCP API 키로는 이 화면을 열 수 없다 — 집계는 사람 계정 단위이므로 로그인으로 돌려보낸다.
	if (!isPayloadUser(user))
		redirect(`/admin/login?redirect=${encodeURIComponent(routes.studio.usage)}`)
	// 범위 제한은 repository가 소유한다 — manager가 아니면 쿼리 자체가 본인 행으로 좁혀진다.
	const rows = await getAiUsageTotals(user)
	const canSeeEveryone = isManager(user)

	return (
		<StudioWorkspacePage
			description={
				canSeeEveryone
					? '모든 계정이 AI에 쓴 토큰의 누계입니다.'
					: '내가 AI에 쓴 토큰의 누계입니다.'
			}
			title="사용량"
		>
			<div className="overflow-auto px-4 py-6 md:px-8">
				<AiUsageTotalsTable rows={rows} showUser={canSeeEveryone} />
			</div>
		</StudioWorkspacePage>
	)
}
