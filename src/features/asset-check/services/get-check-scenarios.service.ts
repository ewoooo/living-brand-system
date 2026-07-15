import { findPublishedCheckScenarios } from '@/features/asset-check/repositories/check-scenario.payload.repository'
import type { CheckScenario } from '@/features/asset-check/scenarios'
import type { User } from '@/payload-types'

/** CheckScenario 조회 유스케이스 — Payload I/O는 check-scenario repository가 소유한다. */
export async function getCheckScenarios(user?: User): Promise<CheckScenario[]> {
	return findPublishedCheckScenarios(user)
}
