import config from '@payload-config'
import { and, desc, eq, sql } from '@payloadcms/db-postgres/drizzle'
import { getPayload } from 'payload'
import { isManager } from '@/lib/auth'
import type { User } from '@/payload-types'
import type { AiUsageFeature, AiUsageTotalsRow } from '../ai-usage'

/**
 * 계정별 토큰 사용량 누계를 (사람 × 기능 × 모델)로 집계한다.
 *
 * 🔴 drizzle 직통 쿼리는 컬렉션 access를 **통과하지 않는다**. 본인 기록만 보이게 하는 제한을
 *    여기서 직접 걸어야 한다 — manager가 아니면 자기 행으로 좁힌다(docs/07 신뢰 경계).
 */
export async function findAiUsageTotals(user: User): Promise<AiUsageTotalsRow[]> {
	const payload = await getPayload({ config })
	const events = payload.db.tables.ai_usage_events
	const users = payload.db.tables.users

	// numeric 컬럼의 SUM은 문자열로 돌아오고, 행이 없으면 null이다 — 0으로 모은 뒤 숫자로 바꾼다.
	const sumOf = (column: unknown) => sql<string>`coalesce(sum(${column}), 0)`
	const total = sumOf(events.totalTokens)

	const rows = await payload.db.drizzle
		.select({
			userId: events.createdBy,
			userEmail: users.email,
			feature: events.feature,
			model: events.model,
			callCount: sql<string>`count(*)`,
			inputTokens: sumOf(events.inputTokens),
			outputTokens: sumOf(events.outputTokens),
			totalTokens: total,
		})
		.from(events)
		.innerJoin(users, eq(users.id, events.createdBy))
		.where(isManager(user) ? undefined : and(eq(events.createdBy, user.id)))
		.groupBy(events.createdBy, users.email, events.feature, events.model)
		.orderBy(desc(total))

	return rows.map((row) => ({
		userId: Number(row.userId),
		userEmail: String(row.userEmail),
		feature: row.feature as AiUsageFeature,
		model: String(row.model),
		callCount: Number(row.callCount),
		inputTokens: Number(row.inputTokens),
		outputTokens: Number(row.outputTokens),
		totalTokens: Number(row.totalTokens),
	}))
}
