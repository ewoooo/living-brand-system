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

/**
 * do/ok/dont 판정 + 카테고리 대조. 정체성은 "판정"이지 그리드가 아니다.
 * 판정이 필요 없는 이미지+캡션 나열이면 ImageTextGrid를 쓴다.
 *
 * @example
 * <DoDont
 *   columns={2}
 *   groups={[
 *     {
 *       category: 'Spacing',
 *       examples: [
 *         { src: url1, caption: '충분한 여백을 확보.', status: 'do' },
 *         { src: url2, caption: '여백을 좁히지 않는다.', status: 'dont' },
 *       ],
 *     },
 *   ]}
 * />
 */
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
