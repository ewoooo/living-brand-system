import config from '@payload-config'
import { and, eq, isNotNull, sql } from '@payloadcms/db-postgres/drizzle'
import { getPayload } from 'payload'
import { isManager } from '@/lib/auth'
import type { User } from '@/payload-types'
import { AI_USAGE_STUDIOS, type AiUsageStudio, type AiUsageStudioRow } from '../ai-usage'

/**
 * 스튜디오별 토큰 사용량 누계.
 *
 * 🔴 **안 쓴 스튜디오도 0으로 돌려준다**(사용자 지시, 2026-09-22). 쿼리 결과가 비었다고 화면에
 *    「사용한 적 없습니다」를 띄우면 「0을 쓴 것」과 「집계가 안 되고 있는 것」을 구별할 수 없다.
 *    그래서 목록의 정본은 DB가 아니라 `AI_USAGE_STUDIOS`이고, 쿼리는 그 위에 값을 얹는다.
 * 🔴 drizzle 직통 쿼리는 컬렉션 access를 **통과하지 않는다** — manager가 아니면 자기 행으로
 *    좁히는 제한을 여기서 직접 건다(docs/07 신뢰 경계).
 */
export async function findAiUsageStudioTotals(user: User): Promise<AiUsageStudioRow[]> {
	const payload = await getPayload({ config })
	const events = payload.db.tables.ai_usage_events

	// numeric 컬럼의 SUM은 문자열로 돌아오고, 행이 없으면 null이다 — 0으로 모은 뒤 숫자로 바꾼다.
	const sumOf = (column: unknown) => sql<string>`coalesce(sum(${column}), 0)`

	const scope = isManager(user) ? undefined : eq(events.createdBy, user.id)
	const rows = await payload.db.drizzle
		.select({
			studio: events.studio,
			callCount: sql<string>`count(*)`,
			inputTokens: sumOf(events.inputTokens),
			outputTokens: sumOf(events.outputTokens),
			totalTokens: sumOf(events.totalTokens),
		})
		.from(events)
		// 스튜디오 밖 호출(admin 미리보기·전역 챗)은 이 표의 대상이 아니다.
		.where(scope ? and(isNotNull(events.studio), scope) : isNotNull(events.studio))
		.groupBy(events.studio)

	const measured = new Map(rows.map((row) => [row.studio as AiUsageStudio, row]))
	return AI_USAGE_STUDIOS.map((studio) => {
		const row = measured.get(studio)
		return {
			studio,
			callCount: Number(row?.callCount ?? 0),
			inputTokens: Number(row?.inputTokens ?? 0),
			outputTokens: Number(row?.outputTokens ?? 0),
			totalTokens: Number(row?.totalTokens ?? 0),
		}
	})
}
