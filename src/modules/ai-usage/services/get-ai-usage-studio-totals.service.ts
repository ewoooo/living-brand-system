import type { AiUsageStudioRow } from '@/modules/ai-usage/ai-usage'
import { findAiUsageStudioTotals } from '@/modules/ai-usage/repositories/ai-usage-studio-totals.payload.repository'
import type { User } from '@/payload-types'

/**
 * 유스케이스 경계: 로그인 계정이 볼 수 있는 스튜디오별 토큰 누계를 돌려준다.
 * 목록은 언제나 스튜디오 전체이고, 안 쓴 곳은 0이다.
 */
export async function getAiUsageStudioTotals(user: User): Promise<AiUsageStudioRow[]> {
	return findAiUsageStudioTotals(user)
}
