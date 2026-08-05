'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ApplicationImage, BrandColor, BrandLogo } from '@/payload-types'
import type { TemplateVectorAssetCollection } from '@/services/template-asset-policy.service'
import type { TemplateNodeConfig } from '@/types/template'

type Asset = (BrandLogo | ApplicationImage) & {
	collection: TemplateVectorAssetCollection
}

const CONTROL_STYLE = {
	padding: '5px 10px',
	borderRadius: 4,
	border: '1px solid var(--theme-elevation-150)',
	background: 'var(--theme-input-bg)',
	color: 'var(--theme-text)',
} as const

export function VectorLayerEditor({
	name,
	config,
	onChange,
}: {
	name: string
	config: TemplateNodeConfig
	onChange: (patch: TemplateNodeConfig) => void
}) {
	const [assets, setAssets] = useState<Asset[]>([])
	const [colors, setColors] = useState<BrandColor[]>([])
	const [loadError, setLoadError] = useState(false)

	useEffect(() => {
		const controller = new AbortController()
		const query = 'depth=0&limit=100&where[_status][equals]=published&sort=name'
		const read = async <T,>(path: string): Promise<T[]> => {
			const response = await fetch(`/api/${path}?${query}`, { signal: controller.signal })
			if (!response.ok) throw new Error('Failed to load template editor options')
			return ((await response.json()) as { docs: T[] }).docs
		}

		void Promise.all([
			read<BrandLogo>('brand-logos'),
			read<ApplicationImage>('application-images'),
			read<BrandColor>('brand-colors'),
		])
			.then(([logos, images, brandColors]) => {
				setAssets([
					...logos.map((asset) => ({ ...asset, collection: 'brand-logos' as const })),
					...images.map((asset) => ({
						...asset,
						collection: 'application-images' as const,
					})),
				])
				setColors(brandColors)
			})
			.catch((error: unknown) => {
				if ((error as { name?: string }).name !== 'AbortError') setLoadError(true)
			})

		return () => controller.abort()
	}, [])

	const assetValue = config.vectorAsset
		? `${config.vectorAsset.collection}:${config.vectorAsset.id}`
		: ''
	const fit = config.vectorFit ?? 'fill'

	return (
		<div
			className="vector-layer-editor"
			style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
		>
			<strong className="text-base">벡터 편집 — {name}</strong>

			<label className="text-sm" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
				브랜드 내부 자산
				<select
					className="text-sm"
					value={assetValue}
					onChange={(event) => {
						const asset = assets.find(
							(item) => `${item.collection}:${item.id}` === event.target.value,
						)
						if (asset?.url) {
							onChange({
								vectorAsset: {
									collection: asset.collection,
									id: asset.id,
									src: asset.url,
								},
							})
						}
					}}
					style={CONTROL_STYLE}
				>
					<option value="">자산 선택</option>
					<optgroup label="Brand Logos">
						{assets
							.filter((asset) => asset.collection === 'brand-logos' && asset.url)
							.map((asset) => (
								<option key={`logo-${asset.id}`} value={`brand-logos:${asset.id}`}>
									{asset.name}
								</option>
							))}
					</optgroup>
					<optgroup label="Application Images">
						{assets
							.filter(
								(asset) => asset.collection === 'application-images' && asset.url,
							)
							.map((asset) => (
								<option
									key={`image-${asset.id}`}
									value={`application-images:${asset.id}`}
								>
									{asset.name}
								</option>
							))}
					</optgroup>
				</select>
			</label>
			<fieldset style={{ border: 0, padding: 0, margin: 0 }}>
				<legend className="text-sm" style={{ marginBottom: 4 }}>
					맞춤 방식
				</legend>
				<ToggleGroup
					type="single"
					value={fit}
					variant="outline"
					size="sm"
					onValueChange={(value) => {
						if (value === 'fill' || value === 'contain') onChange({ vectorFit: value })
					}}
				>
					{(['fill', 'contain'] as const).map((value) => (
						<ToggleGroupItem key={value} value={value}>
							{value === 'fill' ? 'Fill' : 'Contain'}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</fieldset>

			<fieldset style={{ border: 0, padding: 0, margin: 0 }}>
				<legend className="text-sm" style={{ marginBottom: 4 }}>
					브랜드 컬러
				</legend>
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
					<Button
						type="button"
						aria-pressed={!config.vectorColor}
						onClick={() => onChange({ vectorColor: undefined })}
						variant={!config.vectorColor ? 'muted' : 'outline'}
						size="sm"
					>
						원본
					</Button>
					{colors.map((color) => {
						const value = /^[0-9a-f]{3,8}$/i.test(color.hex)
							? `#${color.hex}`
							: color.hex
						const selected = config.vectorColor === value
						return (
							<Button
								key={color.id}
								type="button"
								aria-pressed={selected}
								aria-label={`${color.name} ${value}`}
								onClick={() => onChange({ vectorColor: value })}
								variant={selected ? 'muted' : 'outline'}
								size="sm"
							>
								<span
									aria-hidden
									style={{
										width: 14,
										height: 14,
										borderRadius: 2,
										background: value,
									}}
								/>
								{color.name}
							</Button>
						)
					})}
				</div>
			</fieldset>

			{loadError && (
				<p
					className="text-sm"
					role="alert"
					style={{ margin: 0, color: 'var(--theme-error-500)' }}
				>
					브랜드 자산을 불러오지 못했습니다.
				</p>
			)}
		</div>
	)
}
