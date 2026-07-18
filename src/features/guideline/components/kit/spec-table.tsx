/**
 * 정량 스펙 표 — 브레이크포인트·토큰 값처럼 값을 나열해 비교할 때. 첫 컬럼이 행 식별자다.
 * 프레젠테이션 전용(첫 컬럼 값을 행 key로 씀).
 *
 * @example 브레이크포인트 표
 * <SpecTable
 *   columns={['이름', '최소 너비', '컬럼 수']}
 *   rows={[['sm', '640px', 4], ['md', '768px', 8], ['lg', '1024px', 12]]}
 * />
 *
 * @example 캡션 달기
 * <SpecTable columns={['토큰', '값']} rows={[['spacing-1', '4px']]} caption="간격 토큰" />
 */
export function SpecTable({
	columns,
	rows,
	caption,
}: {
	/** 헤더 라벨 배열. 첫 컬럼이 행 식별자 역할을 한다. */
	columns: string[]
	/** 행 배열. 각 행은 columns 순서에 맞춘 셀 값들이며, 첫 값이 행 key로 쓰인다. */
	rows: (string | number)[][]
	/** 표 아래 캡션(선택). */
	caption?: string
}) {
	return (
		<figure className="m-0">
			<div className="overflow-x-auto border-scrim/10 border-y">
				<table className="w-full border-collapse text-left font-body font-normal text-base">
					<thead>
						<tr>
							{columns.map((column) => (
								<th
									key={column}
									className="border-scrim/10 border-b px-4 py-3 font-body font-medium text-muted-foreground text-xs uppercase tracking-wide"
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
				<figcaption className="mt-2 font-body font-normal text-muted-foreground text-sm">
					{caption}
				</figcaption>
			)}
		</figure>
	)
}
