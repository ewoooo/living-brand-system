import { GuidelineImage } from '@/features/guideline/components/globals/guideline-image'
import { cn } from '@/lib/utils'
import type { ImageRatio } from '@/types/image-ratio'

// Do/Don't 위젯 — legacy `doDont` 블록과 동일한 예시 표현(비율 박스 + kind 배지 + 캡션)을 쓰되
// 세트 헤딩과 프레임·배경은 없다(Block 소관). 배지 색은 디자인시스템 토큰만 사용.
type Kind = 'do' | 'ok' | 'dont'
type Example = {
	id?: string | null
	image?: number | { url?: string | null; alt?: string | null; name?: string | null } | null
	kind: Kind
	caption?: string | null
}

const KIND_BADGE: Record<Kind, { symbol: string; className: string }> = {
	do: { symbol: '✓', className: 'bg-green-500/20 text-green-800' },
	ok: { symbol: '△', className: 'bg-secondary text-secondary-foreground' },
	dont: { symbol: '✕', className: 'bg-destructive/20 text-destructive' },
}

const COLUMN_CLASS = {
	'2': 'lg:grid-cols-2',
	'3': 'lg:grid-cols-3',
	'4': 'lg:grid-cols-4',
} as const

export function DoDontWidget({
	imageRatio,
	columns,
	examples,
}: {
	imageRatio?: ImageRatio | null
	columns?: keyof typeof COLUMN_CLASS | null
	examples?: Example[] | null
}) {
	const items = examples ?? []
	if (items.length === 0) return null

	return (
		<div
			className={
				items.length <= 1
					? 'grid gap-4'
					: cn('grid gap-4 sm:grid-cols-2', COLUMN_CLASS[columns ?? '3'])
			}
		>
			{items.map((example, index) => {
				const badge = KIND_BADGE[example.kind]
				return (
					<figure key={example.id ?? index}>
						<div className="relative">
							<GuidelineImage
								variant="block"
								image={example.image}
								alt={example.caption || ''}
								ratio={imageRatio ?? '4:3'}
								className="bg-muted"
								imgClassName="size-full object-cover"
							/>
							<span
								aria-hidden
								className={cn(
									'absolute top-2 right-2 grid size-6 place-items-center rounded-full font-body font-medium text-xs',
									badge.className,
								)}
							>
								{badge.symbol}
							</span>
						</div>
						{example.caption && (
							<figcaption className="mt-2 font-body font-normal text-muted-foreground text-sm">
								{example.caption}
							</figcaption>
						)}
					</figure>
				)
			})}
		</div>
	)
}

export default DoDontWidget
