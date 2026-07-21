import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type LayoutGrid = Extract<GuidelineBlock, { blockType: 'layoutGrid' }>
type Variant = NonNullable<LayoutGrid['variants']>[number]

// 레이아웃 그리드 규격 시각화 — columns개의 컬럼 오버레이를 CSS grid로 그려 마진/거터를 보여준다.
// 강조색 관계가 populate되면 hex를 오버레이 색으로 사용한다.
export function LayoutGridBlock({ block }: { block: LayoutGrid }) {
	const accent =
		typeof block.accent === 'object' && block.accent !== null ? block.accent.hex : undefined
	const variants = block.variants ?? []

	return (
		<GuidelineBlockFrame layout="padded">
			<div
				className={`grid grid-cols-1 gap-4 ${variants.length > 1 ? 'md:grid-cols-2' : ''}`}
			>
				{variants.map((variant) => (
					<GridDiagram key={variant.id} variant={variant} accent={accent} />
				))}
			</div>
		</GuidelineBlockFrame>
	)
}

export default LayoutGridBlock

function GridDiagram({ variant, accent }: { variant: Variant; accent?: string }) {
	const specs = [
		{ label: 'Columns', value: String(variant.columns) },
		...(variant.gutter ? [{ label: 'Gutter', value: variant.gutter }] : []),
		...(variant.margin ? [{ label: 'Margin', value: variant.margin }] : []),
	]

	return (
		<div className="rounded-lg bg-background-secondary p-6">
			<div className="flex flex-wrap items-baseline justify-between gap-3">
				{variant.label && (
					<h4 className="font-body text-base font-semibold text-foreground">
						{variant.label}
					</h4>
				)}
				<dl className="flex flex-wrap gap-2">
					{specs.map((spec) => (
						<div
							key={spec.label}
							className="flex items-baseline gap-1.5 rounded-full bg-fill-muted px-3 py-1"
						>
							<dt className="font-body text-xs font-normal text-muted-foreground">
								{spec.label}
							</dt>
							<dd className="font-body text-xs font-medium text-foreground tabular-nums">
								{spec.value}
							</dd>
						</div>
					))}
				</dl>
			</div>

			<div
				className="mt-5 grid rounded-md bg-background"
				style={{
					gridTemplateColumns: `repeat(${variant.columns}, minmax(0, 1fr))`,
					columnGap: variant.gutter ?? '0.5rem',
					padding: variant.margin ?? '1rem',
				}}
			>
				{Array.from({ length: variant.columns }, (_, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: 순수 오버레이 바, 재정렬 없음
						key={i}
						className="h-24 rounded-sm bg-fill-hover"
						style={accent ? { backgroundColor: accent, opacity: 0.35 } : undefined}
					/>
				))}
			</div>
		</div>
	)
}
