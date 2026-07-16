// Carbon structured-list 경량 이식: key-value 스펙을 그룹별 카드로 나열한다.
// SpecTable(정량 표)보다 가벼운 카드형 — 타이포/그리드 규격처럼 라벨-값 쌍이 짧을 때 쓴다.

export type SpecItem = {
	/** 왼쪽 라벨 — 규격 항목명(예: 'Columns', 'Weight'). */
	key: string
	/** 오른쪽 값 — 규격 값(예: '12', 'Regular, Bold'). */
	value: string
}
export type SpecGroup = {
	/** 카드 상단 대문자 제목(선택). 없으면 제목 없는 카드로 렌더된다. */
	label?: string
	/** 이 그룹에 속한 라벨-값 쌍 목록. */
	specs: SpecItem[]
}

/**
 * key-value 스펙을 그룹별 카드로 나열 — 타이포·그리드 규격처럼 짧은 라벨-값 쌍용. 표보다 가볍게 드롭인.
 * 정량 데이터를 촘촘한 표로 보여줘야 하면 SpecTable.
 *
 * @example 한 그룹 — 그리드 규격 카드
 * <SpecList groups={[{ label: 'Grid · Desktop', specs: [{ key: 'Columns', value: '12' }, { key: 'Gutter', value: '24px' }] }]} />
 *
 * @example 여러 그룹 — md↑에서 2열로 카드 배치
 * <SpecList groups={[{ label: 'Typography', specs: [{ key: 'Weight', value: 'Regular, Bold' }] }, { label: 'Grid', specs: [{ key: 'Columns', value: '12' }] }]} />
 */
export function SpecList({
	groups,
}: {
	/** 카드로 렌더할 스펙 그룹 목록 — md↑에서 2열 그리드로 배치된다. */
	groups: SpecGroup[]
}) {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
			{groups.map((group, index) => (
				<div key={group.label ?? index} className="rounded-lg bg-background-secondary p-5">
					{group.label && (
						<h4 className="type-caption-1-emphasized text-foreground-muted uppercase tracking-wide">
							{group.label}
						</h4>
					)}
					<dl className={group.label ? 'mt-4' : ''}>
						{group.specs.map((spec) => (
							<div
								key={spec.key}
								className="flex items-baseline justify-between gap-4 py-2.5"
							>
								<dt className="type-callout shrink-0 text-foreground-muted">
									{spec.key}
								</dt>
								<dd className="type-callout-emphasized text-right text-foreground tabular-nums">
									{spec.value}
								</dd>
							</div>
						))}
					</dl>
				</div>
			))}
		</div>
	)
}

export function SpecListDemo() {
	return (
		<SpecList
			groups={[
				{
					label: 'Typography · Pretendard',
					specs: [
						{ key: 'Weight', value: 'Regular, Bold' },
						{ key: 'Kerning', value: 'Metric, -10~0' },
						{ key: 'Word Spacing', value: '55% / 70% / 95%' },
						{ key: 'Leading', value: '140%' },
					],
				},
				{
					label: 'Grid · Desktop',
					specs: [
						{ key: 'Columns', value: '12' },
						{ key: 'Gutter', value: '24px' },
						{ key: 'Margin', value: '80px' },
						{ key: 'Max width', value: '1312px' },
					],
				},
			]}
		/>
	)
}
