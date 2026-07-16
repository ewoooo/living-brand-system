import { CheckResultSummary } from '@/features/asset-check/components/result/check-result-summary'
import type { CheckSection } from '@/features/asset-check/services/get-check-ruleset.service'

/** 서버의 `CheckSection[]`과 선택 이미지의 `results[checkKey]`를 상태별 개수로 요약한다. */
export function ReviewResultOverview({ sections }: { sections: CheckSection[] }) {
	return <CheckResultSummary sections={sections} />
}
