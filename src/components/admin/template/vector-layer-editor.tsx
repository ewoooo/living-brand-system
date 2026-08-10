'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
	FieldTitle,
} from '@/components/ui/field'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
	requestPublishedTemplateVectorAssets,
	type TemplateVectorAsset,
} from '@/services/template-editor-options.client'
import type { TemplateNodeConfig } from '@/types/template'
import { BrandColorSwatches, usePublishedBrandColors } from './brand-color-swatches'

export function VectorLayerEditor({
	name,
	config,
	onChange,
}: {
	name: string
	config: TemplateNodeConfig
	onChange: (patch: TemplateNodeConfig) => void
}) {
	const [assets, setAssets] = useState<TemplateVectorAsset[]>([])
	const [loadError, setLoadError] = useState(false)
	const { colors, loadError: colorLoadError } = usePublishedBrandColors()

	useEffect(() => {
		const controller = new AbortController()
		void requestPublishedTemplateVectorAssets(controller.signal)
			.then(setAssets)
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
		<FieldGroup className="vector-layer-editor gap-3">
			<FieldTitle>벡터 편집 — {name}</FieldTitle>

			<Field>
				<FieldLabel htmlFor="template-vector-asset">브랜드 내부 자산</FieldLabel>
				<Select
					value={assetValue || undefined}
					onValueChange={(value) => {
						const asset = assets.find(
							(item) => `${item.collection}:${item.id}` === value,
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
				>
					<SelectTrigger id="template-vector-asset" className="w-full max-w-sm">
						<SelectValue placeholder="자산 선택" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Brand Logos</SelectLabel>
							{assets.map((asset) =>
								asset.collection === 'brand-logos' && asset.url ? (
									<SelectItem
										key={`logo-${asset.id}`}
										value={`brand-logos:${asset.id}`}
									>
										{asset.name}
									</SelectItem>
								) : null,
							)}
						</SelectGroup>
						<SelectGroup>
							<SelectLabel>Application Images</SelectLabel>
							{assets.map((asset) =>
								asset.collection === 'application-images' && asset.url ? (
									<SelectItem
										key={`image-${asset.id}`}
										value={`application-images:${asset.id}`}
									>
										{asset.name}
									</SelectItem>
								) : null,
							)}
						</SelectGroup>
					</SelectContent>
				</Select>
			</Field>
			<FieldSet className="gap-2">
				<FieldLegend variant="label">맞춤 방식</FieldLegend>
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
			</FieldSet>

			<BrandColorSwatches
				legend="브랜드 컬러"
				colors={colors}
				value={config.vectorColor}
				onPick={(hex) => onChange({ vectorColor: hex })}
			>
				<Button
					type="button"
					aria-pressed={!config.vectorColor}
					onClick={() => onChange({ vectorColor: undefined })}
					variant={!config.vectorColor ? 'muted' : 'outline'}
					size="sm"
				>
					원본
				</Button>
			</BrandColorSwatches>

			{loadError && <FieldError>브랜드 자산을 불러오지 못했습니다.</FieldError>}
			{colorLoadError && <FieldError>브랜드 컬러를 불러오지 못했습니다.</FieldError>}
		</FieldGroup>
	)
}
