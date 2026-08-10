'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FieldLegend, FieldSet } from '@/components/ui/field'
import { isValidHex } from '@/lib/color'
import type { BrandColor } from '@/payload-types'
import { requestPublishedBrandColors } from '@/services/template-editor-options.client'

export function usePublishedBrandColors() {
	const [colors, setColors] = useState<BrandColor[]>([])
	const [loadError, setLoadError] = useState(false)

	useEffect(() => {
		const controller = new AbortController()
		void requestPublishedBrandColors(controller.signal)
			.then(setColors)
			.catch((error: unknown) => {
				if ((error as { name?: string }).name !== 'AbortError') setLoadError(true)
			})
		return () => controller.abort()
	}, [])

	return { colors, loadError }
}

/**
 * published 브랜드 컬러 스와치 그리드 — 유효한 HEX의 표시와 선택만 소유한다.
 * 선택 상태는 호출자가 value로 내려주고 onPick으로 돌려받는 제어 컴포넌트.
 * children은 스와치 앞에 끼운다(예: VectorLayerEditor의 '원본' 버튼).
 */
export function BrandColorSwatches({
	legend,
	colors,
	value,
	onPick,
	disabled,
	children,
}: {
	legend: string
	colors: BrandColor[]
	value?: string
	onPick: (hex: string) => void
	disabled?: boolean
	children?: ReactNode
}) {
	return (
		<FieldSet className="gap-2">
			<FieldLegend variant="label">{legend}</FieldLegend>
			<div className="flex flex-wrap gap-2">
				{children}
				{colors.map((color) => {
					if (!isValidHex(color.hex)) return null
					const hex = color.hex.startsWith('#') ? color.hex : `#${color.hex}`
					const selected = value === hex
					return (
						<Button
							key={color.id}
							type="button"
							disabled={disabled}
							aria-pressed={selected}
							aria-label={`${color.name} ${hex}`}
							onClick={() => onPick(hex)}
							variant={selected ? 'muted' : 'outline'}
							size="sm"
						>
							<span
								aria-hidden
								className="size-3.5 rounded-sm"
								style={{
									backgroundColor: hex,
								}}
							/>
							{color.name}
						</Button>
					)
				})}
			</div>
		</FieldSet>
	)
}
