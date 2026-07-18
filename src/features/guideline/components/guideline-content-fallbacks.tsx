import { Warning } from '@carbon/icons-react'
import type { GuidelineVariant } from './globals/guideline-variant'

// description은 optional — 비어 있으면 아무것도 렌더하지 않는다(빨간 경고 표시 안 함).
export function GuidelineDescriptionFallback(_props: { variant: GuidelineVariant }) {
	return null
}

export function GuidelineImageFallback({
	variant,
	className,
}: {
	variant: GuidelineVariant
	className?: string
}) {
	if (variant !== 'block') return null

	return (
		<div className={`grid min-h-40 place-items-center bg-muted ${className ?? ''}`}>
			<span className="font-body text-sm text-muted-foreground">이미지 없음</span>
		</div>
	)
}

export function GuidelineLabelFallback() {
	return (
		<h2 className="mb-4 flex items-center gap-2 font-body font-normal text-2xl text-destructive">
			<Warning size={36} />
			<span>Label should be fulfilled.</span>
		</h2>
	)
}
