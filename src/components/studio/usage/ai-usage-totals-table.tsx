import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import type { AiUsageFeature, AiUsageTotalsRow } from '@/modules/ai-usage/ai-usage'

const FEATURE_LABEL: Record<AiUsageFeature, string> = {
	'image-generation': '이미지 생성',
	'asset-check': '이미지 검수',
	'agent-chat': '에이전트 대화',
}

const HEAD_CLASS = 'text-sm font-semibold text-muted-foreground'
const NUMBER_CLASS = 'text-right tabular-nums'

function formatTokens(value: number) {
	return value.toLocaleString('ko-KR')
}

export function AiUsageTotalsTable({
	rows,
	showUser,
}: {
	rows: AiUsageTotalsRow[]
	/** manager는 다른 사람의 행도 보므로 누구 것인지 알려 줘야 한다. */
	showUser: boolean
}) {
	if (rows.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyTitle>아직 사용한 토큰이 없습니다</EmptyTitle>
					<EmptyDescription>
						이미지 생성·이미지 검수·에이전트 대화를 쓰면 여기에 쌓입니다.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		)
	}

	const grandTotal = rows.reduce((sum, row) => sum + row.totalTokens, 0)

	return (
		<div className="flex flex-col gap-6">
			<p className="text-sm text-muted-foreground">
				누적 합계{' '}
				<strong className="text-2xl text-foreground tabular-nums">
					{formatTokens(grandTotal)}
				</strong>{' '}
				토큰
			</p>
			<Table>
				<TableHeader>
					<TableRow>
						{showUser && (
							<TableHead scope="col" className={HEAD_CLASS}>
								사용자
							</TableHead>
						)}
						<TableHead scope="col" className={HEAD_CLASS}>
							기능
						</TableHead>
						<TableHead scope="col" className={HEAD_CLASS}>
							모델
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
					{rows.map((row) => (
						<TableRow key={`${row.userId}-${row.feature}-${row.model}`}>
							{showUser && <TableCell>{row.userEmail}</TableCell>}
							<TableCell>{FEATURE_LABEL[row.feature]}</TableCell>
							<TableCell className="font-mono text-xs">{row.model}</TableCell>
							<TableCell className={NUMBER_CLASS}>
								{formatTokens(row.callCount)}
							</TableCell>
							<TableCell className={NUMBER_CLASS}>
								{formatTokens(row.inputTokens)}
							</TableCell>
							<TableCell className={NUMBER_CLASS}>
								{formatTokens(row.outputTokens)}
							</TableCell>
							<TableCell className={`${NUMBER_CLASS} font-semibold`}>
								{formatTokens(row.totalTokens)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}
