import type { CheckExecutor } from '@/features/asset-check/checkers/types'
import {
	findPublishedScenarioCheckRecords,
	type ScenarioCheckRepositoryContext,
} from '@/features/asset-check/repositories/available-scenario-check.payload.repository'

export interface AvailableScenarioCheck {
	blockName: string
	documentTitle: string
	executor?: CheckExecutor
	key: string
	title: string
}

/**
 * CheckScenario 편집용 published Check 목록을 중복 제거하고 표시 순서로 조립한다.
 * Payload 조회와 레코드 변환 I/O는 check-scenario repository가 소유한다.
 */
export async function listAvailableScenarioChecks(
	repositoryContext: ScenarioCheckRepositoryContext,
): Promise<AvailableScenarioCheck[]> {
	const records = await findPublishedScenarioCheckRecords(repositoryContext)
	const byKey = new Map<string, AvailableScenarioCheck>()

	for (const record of records) {
		byKey.set(record.key, {
			blockName: record.blockName ?? '문서',
			documentTitle: record.documentTitle,
			executor: record.executor,
			key: record.key,
			title: record.titleKo?.trim() || record.title,
		})
	}

	return [...byKey.values()].sort(
		(a, b) =>
			a.documentTitle.localeCompare(b.documentTitle, 'ko') ||
			a.blockName.localeCompare(b.blockName, 'ko') ||
			a.title.localeCompare(b.title, 'ko'),
	)
}

/** CheckScenario key 형식을 검증한다. 외부 I/O는 없다. */
export function validateCheckScenarioKey(value: unknown) {
	return (
		(typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) ||
		'Key는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.'
	)
}

/**
 * CheckScenario가 선택한 key의 형식·중복·published Check 존재 여부를 검증한다.
 * Payload 조회와 레코드 변환 I/O는 check-scenario repository가 소유한다.
 */
export async function validateCheckScenarioKeys(
	value: unknown,
	repositoryContext: ScenarioCheckRepositoryContext,
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
	return missing.length > 0 ? `발행된 Guideline에 없는 Check입니다: ${missing.join(', ')}` : true
}
