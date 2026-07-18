import type { PayloadRequest } from 'payload'
import type { CheckExecutor } from '@/features/asset-check/checkers/types'

export interface ScenarioCheckRecord {
	executor?: CheckExecutor
	key: string
	title: string
	titleKo?: string
}

/** CheckScenario 편집에 필요한 published Rule을 Payload 레코드에서 변환한다. */
export async function findPublishedScenarioCheckRecords(
	req: PayloadRequest,
): Promise<ScenarioCheckRecord[]> {
	const { docs } = await req.payload.find({
		collection: 'rules',
		depth: 0,
		draft: false,
		limit: 2000,
		overrideAccess: !req.user,
		user: req.user,
		where: { _status: { equals: 'published' } },
	})

	return docs.map((rule) => ({
		executor: rule.executor,
		key: rule.key,
		title: rule.title,
		titleKo: rule.titleKo ?? undefined,
	}))
}
