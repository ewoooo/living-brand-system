'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { BrandColor } from '@/payload-types'

/**
 * published 브랜드 컬러 스와치 그리드 — fetch·hex 정규화·로드 에러 표기를 소유한다.
 * 선택 상태는 호출자가 value로 내려주고 onPick으로 돌려받는 제어 컴포넌트.
 * children은 스와치 앞에 끼운다(예: VectorLayerEditor의 '원본' 버튼).
 */
export function BrandColorSwatches({
	legend,
	value,
	onPick,
	disabled,
	children,
}: {
	legend: string
	value?: string
	onPick: (hex: string) => void
	disabled?: boolean
	children?: ReactNode
}) {
	const [colors, setColors] = useState<BrandColor[]>([])
	const [loadError, setLoadError] = useState(false)

	useEffect(() => {
		const controller = new AbortController()
		const query = 'depth=0&limit=100&where[_status][equals]=published&sort=name'
		void fetch(`/api/brand-colors?${query}`, { signal: controller.signal })
			.then(async (response) => {
				if (!response.ok) throw new Error('Failed to load brand colors')
				setColors(((await response.json()) as { docs: BrandColor[] }).docs)
			})
			.catch((error: unknown) => {
				if ((error as { name?: string }).name !== 'AbortError') setLoadError(true)
			})
		return () => controller.abort()
	}, [])

	return (
		<fieldset style={{ border: 0, padding: 0, margin: 0 }}>
			<legend className="text-sm" style={{ marginBottom: 4 }}>
				{legend}
			</legend>
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
				{children}
				{colors.map((color) => {
					const hex = /^[0-9a-f]{3,8}$/i.test(color.hex) ? `#${color.hex}` : color.hex
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
								style={{
									width: 14,
									height: 14,
									borderRadius: 2,
									background: hex,
								}}
							/>
							{color.name}
						</Button>
					)
				})}
			</div>
			{loadError && (
				<p
					className="text-sm"
					role="alert"
					style={{ margin: '4px 0 0', color: 'var(--theme-error-500)' }}
				>
					브랜드 컬러를 불러오지 못했습니다.
				</p>
			)}
		</fieldset>
	)
}
