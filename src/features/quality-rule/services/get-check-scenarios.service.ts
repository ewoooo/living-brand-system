import type { User } from '@/payload-types'
import type { CheckScenario } from '../check-scenario'
import { findPublishedCheckScenarios } from '../repositories/check-scenario.payload.repository'

/** CheckScenario 조회 유스케이스 — Payload I/O는 check-scenario repository가 소유한다. */
export async function getCheckScenarios(user?: User): Promise<CheckScenario[]> {
	return findPublishedCheckScenarios(user)
}
