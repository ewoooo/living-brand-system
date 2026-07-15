import { MediaCell, type MediaStatus } from './media-cell'

// 개념 B: do/dont. 정체성은 "판정(do/ok/dont) + 카테고리 대조"지 그리드가 아니다.
// 그리드는 내부 레이아웃일 뿐 — 바깥으로 드러내지 않는다.
export type DoDontExample = {
	src: string
	alt?: string
	caption?: string
	status: MediaStatus
}
export type DoDontGroup = { category?: string; examples: DoDontExample[] }

export function DoDont({ groups, columns = 3 }: { groups: DoDontGroup[]; columns?: number }) {
	return (
		<div className="flex flex-col gap-10">
			{groups.map((group) => (
				<div
					key={
						group.category ?? group.examples.map((example) => example.caption).join('-')
					}
				>
					{group.category && (
						<h4 className="type-body-emphasized mb-4 text-foreground-muted">
							{group.category}
						</h4>
					)}
					<div
						className="grid gap-5"
						style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
					>
						{group.examples.map((example) => (
							<MediaCell
								key={example.caption ?? example.src}
								src={example.src}
								alt={example.alt}
								caption={example.caption}
								status={example.status}
							/>
						))}
					</div>
				</div>
			))}
		</div>
	)
}
