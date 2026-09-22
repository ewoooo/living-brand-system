import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { AiUsageStudioRow } from '@/modules/ai-usage/ai-usage'
import { aiUsageStudioLabel } from '@/modules/ai-usage/ai-usage-catalog'

const HEAD_CLASS = 'text-sm font-semibold text-muted-foreground'
const NUMBER_CLASS = 'text-right tabular-nums'

function formatTokens(value: number) {
	return value.toLocaleString('ko-KR')
}

/**
 * 스튜디오별 토큰 사용량.
 *
 * 🔴 **빈 상태가 없다.** 목록은 스튜디오 전체로 고정이고 안 쓴 곳은 `0`으로 선다
 *    (사용자 지시, 2026-09-22) — 「행이 없다」와 「0을 썼다」는 보는 사람에게 다른 말이고,
 *    전자는 집계가 고장 난 것처럼 읽힌다.
 */
export function AiUsageStudioTable({ rows }: { rows: AiUsageStudioRow[] }) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead scope="col" className={HEAD_CLASS}>
						스튜디오
					</TableHead>
					<TableHead scope="col" className={`${HEAD_CLASS} ${NUMBER_CLASS}`}>
						호출
					</TableHead>
					<TableHead scope="col" className={`${HEAD_CLASS} ${NUMBER_CLASS}`}>
						입력
					</TableHead>
					<TableHead scope="col" className={`${HEAD_CLASS} ${NUMBER_CLASS}`}>
						출력
					</TableHead>
					<TableHead scope="col" className={`${HEAD_CLASS} ${NUMBER_CLASS}`}>
						합계
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{rows.map((row) => {
					// 안 쓴 줄은 숫자를 죽여 둔다 — 0이 보이되 쓴 줄을 가리지 않는다.
					const unused = row.totalTokens === 0 && row.callCount === 0
					return (
						<TableRow key={row.studio ?? 'outside'}>
							<TableCell className={cn(unused && 'text-muted-foreground')}>
								{aiUsageStudioLabel(row.studio)}
							</TableCell>
							<TableCell
								className={cn(NUMBER_CLASS, unused && 'text-muted-foreground')}
							>
								{formatTokens(row.callCount)}
							</TableCell>
							<TableCell
								className={cn(NUMBER_CLASS, unused && 'text-muted-foreground')}
							>
								{formatTokens(row.inputTokens)}
							</TableCell>
							<TableCell
								className={cn(NUMBER_CLASS, unused && 'text-muted-foreground')}
							>
								{formatTokens(row.outputTokens)}
							</TableCell>
							<TableCell
								className={cn(NUMBER_CLASS, unused && 'text-muted-foreground')}
							>
								{formatTokens(row.totalTokens)}
							</TableCell>
						</TableRow>
					)
				})}
			</TableBody>
		</Table>
	)
}
