import { redirect } from 'next/navigation'
import { StudioWorkspacePage } from '@/components/studio/shared/studio-workspace'
import { AiUsageStudioTable } from '@/components/studio/usage/ai-usage-studio-table'
import { AiUsageTotalsTable } from '@/components/studio/usage/ai-usage-totals-table'
import { isManager, isPayloadUser } from '@/lib/auth'
import { requireUser } from '@/lib/request-auth'
import { routes } from '@/lib/routes'
import { getAiUsageStudioTotals } from '@/modules/ai-usage/services/get-ai-usage-studio-totals.service'
import { getAiUsageTotals } from '@/modules/ai-usage/services/get-ai-usage-totals.service'

// 렌더링: 매 요청. 로그인 계정에 따라 보이는 행이 달라지므로 캐시하지 않는다(docs/05).
export const dynamic = 'force-dynamic'

export default async function StudioUsagePage() {
	const { user } = await requireUser(routes.studio.usage)
	// MCP API 키로는 이 화면을 열 수 없다 — 집계는 사람 계정 단위이므로 로그인으로 돌려보낸다.
	if (!isPayloadUser(user))
		redirect(`/admin/login?redirect=${encodeURIComponent(routes.studio.usage)}`)
	// 범위 제한은 repository가 소유한다 — manager가 아니면 쿼리 자체가 본인 행으로 좁혀진다.
	const [rows, studioRows] = await Promise.all([
		getAiUsageTotals(user),
		getAiUsageStudioTotals(user),
	])
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
			<div className="flex flex-col gap-10 overflow-auto px-4 py-6 md:px-8">
				<section className="flex flex-col gap-3">
					<h2 className="font-semibold text-sm">스튜디오별</h2>
					{/* 🔴 안 쓴 스튜디오도 0으로 선다 — 표 자체에 빈 상태가 없다. */}
					<AiUsageStudioTable rows={studioRows} />
				</section>
				{/* 🔴 비면 절을 통째로 감춘다 — 위 표가 이미 0을 말하고 있는데 여기서 「없습니다」를
				    다시 띄우면 「0을 썼다」가 「집계가 안 된다」로 읽힌다(사용자 지시, 2026-09-22).
				    쪼갤 축이 계정·모델이라 안 쓴 조합을 0행으로 세울 수는 없다. */}
				{rows.length > 0 && (
					<section className="flex flex-col gap-3">
						<h2 className="font-semibold text-sm">계정·기능·모델별</h2>
						<AiUsageTotalsTable rows={rows} showUser={canSeeEveryone} />
					</section>
				)}
			</div>
		</StudioWorkspacePage>
	)
}
