import type { AiUsageTotalsRow } from '@/modules/ai-usage/ai-usage'
import { findAiUsageTotals } from '@/modules/ai-usage/repositories/ai-usage-totals.payload.repository'
import type { User } from '@/payload-types'

/**
 * 유스케이스 경계: 로그인 계정이 볼 수 있는 토큰 사용량 누계를 돌려준다.
 * 범위 제한(본인 행 / 전체)과 Payload 접근은 ai-usage repository가 소유한다 —
 * 화면은 repository를 직접 부르지 않는다(docs/06 의존 방향, layer-boundaries 검사).
 */
export async function getAiUsageTotals(user: User): Promise<AiUsageTotalsRow[]> {
	return findAiUsageTotals(user)
}
