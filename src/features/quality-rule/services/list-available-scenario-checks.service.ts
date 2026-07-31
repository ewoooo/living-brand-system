import { findPublishedScenarioCheckRecords } from '../repositories/available-scenario-check.payload.repository'
import type { RuleExecutor } from '../rule-executor'

export interface AvailableScenarioCheck {
	executor?: RuleExecutor
	key: string
	title: string
}

/**
 * CheckScenario 편집용 published Rule 목록을 표시 순서로 조립한다.
 * Payload 조회와 레코드 변환 I/O는 check-scenario repository가 소유한다.
 */
export async function listAvailableScenarioChecks(
	repositoryContext: Parameters<typeof findPublishedScenarioCheckRecords>[0],
): Promise<AvailableScenarioCheck[]> {
	const records = await findPublishedScenarioCheckRecords(repositoryContext)

	return records
		.map((record) => ({
			executor: record.executor,
			key: record.key,
			title: record.titleKo?.trim() || record.title,
		}))
		.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
}

/** CheckScenario key 형식을 검증한다. 외부 I/O는 없다. */
export function validateCheckScenarioKey(value: unknown) {
	return (
		(typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) ||
		'Key는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.'
	)
}

/**
 * CheckScenario가 선택한 key의 형식·중복·published Rule 존재 여부를 검증한다.
 * Payload 조회와 레코드 변환 I/O는 check-scenario repository가 소유한다.
 */
export async function validateCheckScenarioKeys(
	value: unknown,
	repositoryContext: Parameters<typeof findPublishedScenarioCheckRecords>[0],
) {
	if (!Array.isArray(value) || value.length === 0) return 'Check를 1개 이상 포함하세요.'
	if (value.some((key) => typeof key !== 'string' || !key.trim())) {
		return 'Check key는 비어 있지 않은 문자열이어야 합니다.'
	}

	const checkKeys = value as string[]
	if (new Set(checkKeys).size !== checkKeys.length) return '중복된 Check가 있습니다.'

	const availableKeys = new Set(
		(await listAvailableScenarioChecks(repositoryContext)).map(({ key }) => key),
	)
	const missing = checkKeys.filter((key) => !availableKeys.has(key))
	return missing.length > 0 ? `발행된 검수 규칙에 없는 Check입니다: ${missing.join(', ')}` : true
}
