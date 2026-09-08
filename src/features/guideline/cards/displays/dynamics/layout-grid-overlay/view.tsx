'use client'

import {
	controllerBoolean,
	controllerNumber,
	useGuidelineController,
} from '@/features/guideline/controllers/provider'
import { OVERLAY_CONTROLS } from './manifest'

export type LayoutParams = { sections: number; padding: number; gap: number; columns: number }
export type ImageSpec = { src: string; width: number; height: number }

/** 값은 원본 이미지 좌표다. 과한 패딩·갭으로 음수 셀이 생기지 않도록 이미지별로 제한한다. */
export function overlayGeometry(image: ImageSpec, params: LayoutParams) {
	const width = Math.max(1, image.width)
	const height = Math.max(1, image.height)
	const sections = Math.max(1, Math.min(12, Math.floor(params.sections)))
	const columns = Math.max(1, Math.min(12, Math.floor(params.columns)))
	const sectionHeight = height / sections
	const padding = Math.max(0, Math.min(params.padding, width / 2, sectionHeight / 2))
	const contentWidth = width - padding * 2
	const gap = columns > 1 ? Math.max(0, Math.min(params.gap, contentWidth / (columns - 1))) : 0
	return {
		width,
		height,
		sections,
		columns,
		sectionHeight,
		padding,
		gap,
		colWidth: (contentWidth - gap * (columns - 1)) / columns,
	}
}

export function LayoutGridOverlay({
	images,
	defaults,
	accent,
}: {
	images: ImageSpec[]
	defaults?: Partial<LayoutParams>
	accent: string
}) {
	const { values } = useGuidelineController()
	const read = (id: keyof LayoutParams) =>
		controllerNumber(
			values,
			id,
			defaults?.[id] ??
				Number(OVERLAY_CONTROLS.find((control) => control.id === id)?.defaultValue),
		)
	const params = {
		sections: read('sections'),
		columns: read('columns'),
		padding: read('padding'),
		gap: read('gap'),
	}
	const guidesOn = controllerBoolean(values, 'guidesOn', true)
	return (
		<div className="flex size-full min-h-0 min-w-0 gap-4">
			{images.map((image) => {
				const g = overlayGeometry(image, params)
				return (
					<svg
						key={image.src}
						className="h-full min-w-0 flex-1"
						viewBox={`0 0 ${g.width} ${g.height}`}
						preserveAspectRatio="xMidYMid meet"
						role="img"
						aria-label="레이아웃 이미지와 격자"
					>
						<title>레이아웃 이미지와 격자</title>
						<image
							href={image.src}
							width={g.width}
							height={g.height}
							opacity={guidesOn ? 0.5 : 1}
						/>
						{guidesOn &&
							Array.from({ length: g.sections }, (_, row) =>
								Array.from({ length: g.columns }, (_, col) => (
									<rect
										// biome-ignore lint/suspicious/noArrayIndexKey: 행·열 좌표가 격자 셀의 정체성이다.
										key={`${row}-${col}`}
										x={g.padding + col * (g.colWidth + g.gap)}
										y={row * g.sectionHeight + g.padding}
										width={g.colWidth}
										height={g.sectionHeight - 2 * g.padding}
										fill="none"
										stroke={accent}
										strokeWidth={1}
										vectorEffect="non-scaling-stroke"
									/>
								)),
							)}
					</svg>
				)
			})}
		</div>
	)
}
