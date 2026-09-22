import config from '@payload-config'
import { eq, sql } from '@payloadcms/db-postgres/drizzle'
import { getPayload } from 'payload'
import { isManager } from '@/lib/auth'
import type { User } from '@/payload-types'
import type { AiUsageStudioRow } from '../ai-usage'
import { AI_USAGE_STUDIOS, type AiUsageStudio } from '../ai-usage-catalog'

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

	const rows = await payload.db.drizzle
		.select({
			studio: events.studio,
			callCount: sql<string>`count(*)`,
			inputTokens: sumOf(events.inputTokens),
			outputTokens: sumOf(events.outputTokens),
			totalTokens: sumOf(events.totalTokens),
		})
		.from(events)
		.where(isManager(user) ? undefined : eq(events.createdBy, user.id))
		.groupBy(events.studio)

	const measured = new Map(rows.map((row) => [(row.studio ?? null) as AiUsageStudio | null, row]))
	const toRow = (studio: AiUsageStudio | null): AiUsageStudioRow => {
		const row = measured.get(studio)
		return {
			callCount: Number(row?.callCount ?? 0),
			inputTokens: Number(row?.inputTokens ?? 0),
			outputTokens: Number(row?.outputTokens ?? 0),
			studio,
			totalTokens: Number(row?.totalTokens ?? 0),
		}
	}

	// 🔴 스튜디오 밖 호출(전역 헤더 챗 등)을 버리지 않는다. 버리면 이 표의 합과 전체 누계가
	//    어긋나고, 보는 사람에게는 토큰이 증발한 것으로 읽힌다.
	const outside = toRow(null)
	const studios = AI_USAGE_STUDIOS.map((option) => toRow(option.value))
	// 쓴 것을 먼저 세운다 — 0인 줄이 중간에 끼면 표가 끊겨 읽힌다. 같은 값이면 카탈로그 순서.
	const used = studios.filter((row) => row.callCount > 0)
	const unused = studios.filter((row) => row.callCount === 0)
	return [...used, ...(outside.callCount > 0 ? [outside] : []), ...unused]
}
