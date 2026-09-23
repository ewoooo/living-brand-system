import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import type { AiUsageBreakdownRow } from '@/modules/ai-usage/ai-usage-breakdown'
import { AI_USAGE_AXES, AI_USAGE_PERIODS } from '@/modules/ai-usage/ai-usage-catalog'
import { foldAiUsage } from '@/modules/ai-usage/ai-usage-fold'
import {
	type AiUsageQuery,
	aiUsageAxisHref,
	aiUsagePeriodHref,
} from '@/modules/ai-usage/ai-usage-query'
import { AiUsageBreakdownTable } from './ai-usage-breakdown-table'
import { AiUsageDailyStrip } from './ai-usage-daily-strip'
import { AiUsageFilterChips } from './ai-usage-filter-chips'
import { AiUsageKpis } from './ai-usage-kpis'
import { AiUsageSegment } from './ai-usage-segment'

/**
 * 사용량 화면의 몸통 — 기간 하나, 축 하나, 표 하나. 전체 페이지와 한 사람 페이지가 같은 것을 쓴다.
 *
 * 🔑 상태가 전부 URL에 있어서 여기에 클라이언트 state가 없다(세그먼트의 링크만 client다).
 *    그래서 새로고침·링크 공유에 안 날아가고, 축을 바꿔도 기간과 필터가 유지된다.
 * 🔴 「날짜」는 축이 아니다 — 다른 축과 배타로 고르는 것이 아니라 언제나 켜져 있는 분포라,
 *    축 세그먼트가 아니라 상시 일자 스트립이 맡는다.
 */
export function AiUsageView({
	query,
	rows,
	scopedUserId,
	todayKey,
}: {
	query: AiUsageQuery
	rows: AiUsageBreakdownRow[]
	/** 한 사람의 페이지면 그 계정 id. 🔴 범위는 칩이 아니라 주소의 세그먼트가 갖는다. */
	scopedUserId?: string
	todayKey: string
}) {
	// 한 사람만 보는 화면에서 「계정」 축은 한 줄짜리 표라 뜻이 없다.
	const axes =
		scopedUserId === undefined
			? AI_USAGE_AXES
			: AI_USAGE_AXES.filter((option) => option.value !== 'user')
	const axis = axes.some((option) => option.value === query.axis) ? query.axis : 'feature'
	const filters =
		scopedUserId === undefined ? query.filters : { ...query.filters, user: scopedUserId }
	const fold = foldAiUsage(rows, { ...query, axis, filters, todayKey })

	// 계정 id는 그 자체로 못 읽는다 — 칩에 쓸 이름을 원본에서 찾아 준다.
	const filteredEmail = rows.find((row) => String(row.userId) === query.filters.user)?.userEmail

	return (
		<div className="flex flex-col gap-6 overflow-auto px-4 py-6 md:px-8">
			{/* 🔴 기간은 축보다 물리적으로 위다 — 축 안에 든 것처럼 읽히면 안 된다. */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<AiUsageSegment
					ariaLabel="기간"
					options={AI_USAGE_PERIODS.map((period) => ({
						href: aiUsagePeriodHref(query, period.value),
						label: period.label,
						value: period.value,
					}))}
					value={query.period}
				/>
				<AiUsageFilterChips labels={{ user: filteredEmail }} query={query} />
			</div>

			<AiUsageKpis fold={fold} />
			<AiUsageDailyStrip days={fold.daily} />

			<div className="flex flex-col gap-3">
				<AiUsageSegment
					ariaLabel="분해 축"
					options={axes.map((option) => ({
						href: aiUsageAxisHref(query, option.value),
						label: option.label,
						value: option.value,
					}))}
					value={axis}
				/>
				{fold.rows.length > 0 ? (
					<AiUsageBreakdownTable axis={axis} fold={fold} query={query} />
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>이 조건에 해당하는 기록이 없습니다</EmptyTitle>
							<EmptyDescription>
								기간을 넓히거나 필터를 해제해 보세요.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</div>
		</div>
	)
}
