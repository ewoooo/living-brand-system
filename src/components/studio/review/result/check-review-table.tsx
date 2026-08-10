'use client'

import { useMemo } from 'react'
import { Table, TableBody } from '@/components/ui/table'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { CheckSection } from '@/features/asset-check/domain/runtime-check'
import { useCheckImages } from '@/features/asset-check/hooks/use-check-images'
import {
	buildCheckReviewView,
	type CheckReviewRow,
} from '@/features/asset-check/utils/build-check-review-view'
import { CheckRow } from './check-review-row'

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
 *   expandable: boolean            // 결과가 있고 검사 중이 아닐 때만 상세 열기 가능
 *   detail: string | null          // 화면에서 조합한 판정 또는 진행 문구
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
			<Table className="table-fixed border-collapse">
				<CheckTableColumns />
				<TableBody>
					<TableContents rows={rows} selectedId={selectedId} />
				</TableBody>
			</Table>
		</TooltipProvider>
	)
}

function CheckTableColumns() {
	return (
		<colgroup>
			<col className="w-8" />
			<col className="w-64" />
			<col />
			<col className="w-24" />
			<col className="w-8" />
		</colgroup>
	)
}

function TableContents({
	rows,
	selectedId,
}: {
	rows: CheckReviewRow[]
	selectedId: string | null
}) {
	return (
		<>
			{rows.map((row, index) => (
				<CheckRow key={`${selectedId ?? 'empty'}:${row.rowId}`} {...row} rowIndex={index} />
			))}
		</>
	)
}
