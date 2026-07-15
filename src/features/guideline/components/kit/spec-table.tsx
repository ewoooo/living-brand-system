// Carbon data-table 이식: 정량 스펙(브레이크포인트·토큰 값 등)용 범용 표.
// 프레젠테이션 전용 — 첫 컬럼 값을 행 key로 쓴다(스펙 표는 첫 컬럼이 식별자).
export function SpecTable({
	columns,
	rows,
	caption,
}: {
	columns: string[]
	rows: (string | number)[][]
	caption?: string
}) {
	return (
		<figure className="m-0">
			<div className="overflow-x-auto border-scrim/10 border-y">
				<table className="type-body w-full border-collapse text-left">
					<thead>
						<tr>
							{columns.map((column) => (
								<th
									key={column}
									className="type-caption-1-emphasized border-scrim/10 border-b px-4 py-3 text-foreground-muted uppercase tracking-wide"
								>
									{column}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={String(row[0])}>
								{row.map((cell, index) => (
									<td
										key={columns[index] ?? index}
										className="border-scrim/10 border-b px-4 py-3 text-foreground tabular-nums last:border-0"
									>
										{cell}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{caption && (
				<figcaption className="type-callout mt-2 text-foreground-muted">
					{caption}
				</figcaption>
			)}
		</figure>
	)
}
