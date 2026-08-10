import type { User } from '@/payload-types'
import type { CheckScenario } from '../check-scenario'
import { findPublishedCheckScenarios } from '../repositories/check-scenario.payload.repository'

/**
 * review 화면이 CheckImageProvider에 넘길 published CheckScenario 목록을 읽는다.
 * Payload 조회는 check-scenario repository가 소유한다.
 */
export async function listPublishedCheckScenarios(user?: User): Promise<CheckScenario[]> {
	return findPublishedCheckScenarios(user)
}
