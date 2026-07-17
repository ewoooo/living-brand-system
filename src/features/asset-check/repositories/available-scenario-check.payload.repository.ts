import type { PayloadRequest } from 'payload'
import type { CheckExecutor } from '@/features/asset-check/checkers/types'
import { collectGuidelineCheckSources } from '@/features/guideline/checks/collect-guideline-check-sources'
import { findPublishedUnifiedGuidelineCheckDocuments } from '@/features/guideline/repositories/published-guideline-checks.payload.repository'

export interface ScenarioCheckRecord {
	blockName: string | null
	documentTitle: string
	executor?: CheckExecutor
	key: string
	title: string
	titleKo?: string
}

/** CheckScenario 편집에 필요한 published Guideline Check를 Payload 레코드에서 변환한다. */
export async function findPublishedScenarioCheckRecords(
	req: PayloadRequest,
): Promise<ScenarioCheckRecord[]> {
	const { documents } = await findPublishedUnifiedGuidelineCheckDocuments(req.payload, {
		overrideAccess: !req.user,
		user: req.user,
	})

	return documents.flatMap((document) =>
		collectGuidelineCheckSources(document).map(({ blockName, rule }) => {
			const checker = typeof rule.checker === 'object' ? rule.checker : null

			return {
				blockName,
				documentTitle: document.title,
				executor: checker?.executor,
				key: rule.key,
				title: rule.title,
				titleKo: rule.titleKo ?? undefined,
			}
		}),
	)
}
