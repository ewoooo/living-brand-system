'use client'

import { useMemo } from 'react'
import { Empty, EmptyDescription } from '@/components/ui/empty'
import { Table, TableBody } from '@/components/ui/table'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useCheckImages } from '@/features/asset-check/components/check-image-provider'
import { CheckRow } from '@/features/asset-check/components/result/check-review-row'
import type { CheckSection } from '@/features/asset-check/services/get-check-ruleset.service'
import { buildCheckReviewView } from '@/features/asset-check/utils/build-check-review-view'

/**
 * 퍼널 ④ — 검수 결과 테이블 컨테이너.
 * in : sections: CheckSection[] + 컨텍스트 { scenarios, scenarioKey, selected, showFailOnly }
 * 조립: buildCheckReviewView(...).rows → CheckReviewRow[] {
 *   check: RuntimeCheck            // snapshot 우선(selected.rulesetSnapshot), 없으면 현재 룰
 *   rowId: `${scenarioKey}:${checkKey}`
 *   scenarioLabel: string | null   // 시나리오 첫 행에만 제목 표시
 *   appliesTo: string[]            // 같은 check를 참조하는 섹션 제목들
 *   guidelineHref: string          // /guideline/{chapter}[/{section}][#slug]
 *   anchorId: string | null       // 시나리오 첫 행에만 scenario.key
 *   outcome?: CheckResult          // 미판정이면 undefined
 *   inProgress: boolean            // status 'running' && pendingCheckKeys에 포함
 *   detail: string | null          // pass 아닐 때만 outcome.message
 * }
 * showFailOnly && results 존재 시 rawResult.status === 'fail' 행만 남김
 */
export function CheckSections({ sections }: { sections: CheckSection[] }) {
	const { scenarios, scenarioKey, selectedId, selected, showFailOnly } = useCheckImages()
	const { rows } = useMemo(
		() => buildCheckReviewView({ sections, scenarios, scenarioKey, selected, showFailOnly }),
		[sections, scenarios, scenarioKey, selected, showFailOnly],
	)

	return (
		<TooltipProvider delayDuration={150}>
			<div className="py-8">
				<Table className="table-fixed border-collapse">
					<CheckTableColumns />
					<TableBody>
						{rows.map((row, index) => (
							<CheckRow
								key={`${selectedId ?? 'empty'}:${row.rowId}`}
								{...row}
								rowIndex={index}
							/>
						))}
					</TableBody>
				</Table>
				{showFailOnly && rows.length === 0 && (
					<Empty>
						<EmptyDescription>미통과 항목이 없습니다.</EmptyDescription>
					</Empty>
				)}
			</div>
		</TooltipProvider>
	)
}

function CheckTableColumns() {
	return (
		<colgroup>
			<col className="w-44" />
			<col className="w-8" />
			<col className="w-56" />
			<col />
			<col className="w-36" />
			<col className="w-8" />
		</colgroup>
	)
}
