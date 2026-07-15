// biome-ignore-all lint/suspicious/noArrayIndexKey: Evidence snapshots preserve order and intentionally omit item IDs.
import type { CheckReferenceAsset } from '@/features/asset-check/services/get-check-ruleset.service'
import type {
	CheckBlockEvidence,
	CheckEvidence as Evidence,
} from '@/features/guideline/blocks/types'

export function CheckEvidence({
	evidence,
	referenceAssets,
}: {
	evidence: Evidence | string
	referenceAssets: CheckReferenceAsset[]
}) {
	if (!hasContent(evidence) && referenceAssets.length === 0) {
		return <p className="type-body text-foreground-muted">관련 가이드라인 없음</p>
	}

	return (
		<div className="type-body grid gap-3">
			{typeof evidence === 'string' ? (
				<p className="whitespace-pre-wrap text-foreground-muted">{evidence}</p>
			) : evidence.type === 'document' ? (
				<>
					{evidence.description && (
						<p className="whitespace-pre-wrap text-foreground-muted">
							{evidence.description}
						</p>
					)}
					<div className="divide-y divide-border">
						{evidence.blocks.map((block, index) => (
							<div
								key={`${block.type}-${index}`}
								className="py-3 first:pt-0 last:pb-0"
							>
								<BlockEvidence evidence={block} />
							</div>
						))}
					</div>
				</>
			) : (
				<BlockEvidence evidence={evidence} />
			)}
			<ReferenceAssets assets={referenceAssets} />
		</div>
	)
}

function BlockEvidence({ evidence }: { evidence: CheckBlockEvidence }) {
	switch (evidence.type) {
		case 'columnUnit':
			return (
				<div className="grid gap-2">
					{evidence.columns.map((column, index) => (
						<section
							key={`${column.heading ?? 'column'}-${index}`}
							className="rounded-md bg-fill-muted px-3 py-2.5"
						>
							{column.heading && (
								<h4 className="type-body-emphasized mb-1">{column.heading}</h4>
							)}
							{column.body && (
								<p className="whitespace-pre-wrap text-foreground-muted">
									{column.body}
								</p>
							)}
						</section>
					))}
				</div>
			)
		case 'mediaShowcase':
			return <p className="text-foreground-muted">이미지 기준</p>
		case 'colorPalette':
			return (
				<section>
					{evidence.title && (
						<h4 className="type-body-emphasized mb-2">{evidence.title}</h4>
					)}
					<ul className="grid gap-2 sm:grid-cols-2">
						{evidence.colors.map((color, index) => (
							<li
								key={`${color.name}-${color.hex}-${index}`}
								className="flex items-center gap-3 rounded-md border px-3 py-2"
							>
								<span
									aria-hidden
									className="size-8 shrink-0 rounded-sm border border-scrim/10"
									style={{ backgroundColor: color.hex }}
								/>
								<div>
									<p className="type-body-emphasized">{color.name}</p>
									<p className="text-foreground-muted">
										HEX {color.hex}
										{color.pantone ? ` · PMS ${color.pantone}` : ''}
									</p>
								</div>
							</li>
						))}
					</ul>
				</section>
			)
		case 'doDont':
			return (
				<section>
					{evidence.title && (
						<h4 className="type-body-emphasized mb-2">{evidence.title}</h4>
					)}
					<div className="grid gap-3">
						{evidence.groups.map((group, groupIndex) => (
							<div key={`${group.category ?? 'group'}-${groupIndex}`}>
								{group.category && (
									<p className="type-body-emphasized mb-1.5 text-foreground-muted">
										{group.category}
									</p>
								)}
								<ul className="grid gap-1.5">
									{group.examples.map((example, exampleIndex) => (
										<li
											key={`${example.kind}-${example.caption ?? ''}-${exampleIndex}`}
											className="grid grid-cols-[auto_1fr] items-start gap-2"
										>
											<span
												className={`type-callout-emphasized rounded px-1.5 py-0.5 ${
													example.kind === 'do'
														? 'bg-success text-success-foreground'
														: 'bg-destructive text-destructive-foreground'
												}`}
											>
												{example.kind === 'do' ? '권장' : '금지'}
											</span>
											{example.caption && <span>{example.caption}</span>}
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</section>
			)
	}
}

function ReferenceAssets({ assets }: { assets: CheckReferenceAsset[] }) {
	if (assets.length === 0) return null
	const roleLabel = { positive: '권장', negative: '금지', context: '참고' }

	return (
		<div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
			<span className="text-foreground-muted">기준 이미지 {assets.length}개</span>
			{assets.map((asset) => (
				<a
					key={`${asset.url}-${asset.name}-${asset.role}`}
					href={asset.url}
					target="_blank"
					rel="noreferrer"
					className="rounded-md border px-2 py-1 text-foreground transition-colors hover:bg-fill-hover"
				>
					{roleLabel[asset.role]} · {asset.name}
				</a>
			))}
		</div>
	)
}

function hasContent(evidence: Evidence | string) {
	if (typeof evidence === 'string') return Boolean(evidence.trim())
	if (evidence.type === 'document') return Boolean(evidence.description || evidence.blocks.length)
	if (evidence.type === 'columnUnit') return evidence.columns.length > 0
	if (evidence.type === 'colorPalette') return Boolean(evidence.title || evidence.colors.length)
	if (evidence.type === 'doDont') return Boolean(evidence.title || evidence.groups.length)
	return true
}
