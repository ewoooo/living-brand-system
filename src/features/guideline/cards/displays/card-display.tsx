import { cn } from '@/lib/utils'
import { GuidelineHelperRegion } from '../../controllers/helper'
import { GuidelineControllerPill } from '../../controllers/pill'
import { type DisplayData, renderDisplay } from './registry.render'

/** 정적 이미지 또는 동적 표본을 카드 안에 놓고, 조작 가능한 표본만 활성 영역으로 등록한다. */
export function CardDisplay({
	display,
	title,
	controllerLabel,
}: {
	display: DisplayData
	title?: string | null
	controllerLabel?: string
}) {
	if (display.blockType === 'staticDisplay')
		return renderDisplay(display, { alt: title ?? undefined })
	return (
		<div
			data-slot="card-display"
			className={cn(
				'absolute inset-0 overflow-clip',
				display.blockType === 'layoutGridOverlayWidget' && 'inset-[10%]',
			)}
		>
			{controllerLabel !== undefined ? (
				<GuidelineHelperRegion
					className="absolute inset-0"
					label={title ?? controllerLabel}
					controls={<GuidelineControllerPill />}
				>
					{renderDisplay(display)}
				</GuidelineHelperRegion>
			) : (
				renderDisplay(display)
			)}
		</div>
	)
}
