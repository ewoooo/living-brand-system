import { Warning } from '@carbon/icons-react'
import type { GuidelineVariant } from './globals/guideline-variant'

// description은 optional — 비어 있으면 아무것도 렌더하지 않는다(빨간 경고 표시 안 함).
export function GuidelineDescriptionFallback(_props: { variant: GuidelineVariant }) {
	return null
}

export function GuidelineLabelFallback() {
	return (
		<h2 className="mb-4 flex items-center gap-2 font-body font-normal text-2xl text-destructive">
			<Warning size={36} />
			<span>Label should be fulfilled.</span>
		</h2>
	)
}
