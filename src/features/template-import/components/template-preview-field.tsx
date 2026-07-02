'use client'

import { TextInput, useForm, useFormFields } from '@payloadcms/ui'
import { useEffect, useMemo, useState } from 'react'
import { TemplateRenderer } from '@/components/template-renderer'
import {
	AUTHORIZED_ASSET_COLLECTIONS,
	type JsonTemplate,
	jsonTemplateSchema,
} from '@/types/json-template'

const PREVIEW_MAX_WIDTH = 640

const ASSET_COLLECTION_LABELS: Record<string, string> = {
	'brand-logos': '브랜드 로고',
	'application-images': '어플리케이션 이미지',
}

interface AuthorizedAssetOption {
	collection: (typeof AUTHORIZED_ASSET_COLLECTIONS)[number]
	id: number
	name: string
	url: string
}

/** 인가 에셋 컬렉션 목록을 REST로 읽는다. 교체 선택지로만 쓰므로 이름과 URL만 남긴다. */
function useAuthorizedAssets(): AuthorizedAssetOption[] {
	const [assets, setAssets] = useState<AuthorizedAssetOption[]>([])

	useEffect(() => {
		let cancelled = false

		Promise.all(
			AUTHORIZED_ASSET_COLLECTIONS.map(async (collection) => {
				const response = await fetch(`/api/${collection}?limit=100&depth=0`, {
					credentials: 'same-origin',
				})

				if (!response.ok) {
					return []
				}

				const body = await response.json().catch(() => null)

				return (body?.docs ?? [])
					.filter((doc: { id?: number; url?: string }) => doc.id && doc.url)
					.map((doc: { id: number; url: string; name?: string; alt?: string }) => ({
						collection,
						id: doc.id,
						name: doc.name || doc.alt || `#${doc.id}`,
						url: doc.url,
					}))
			}),
		).then((groups) => {
			if (!cancelled) {
				setAssets(groups.flat())
			}
		})

		return () => {
			cancelled = true
		}
	}, [])

	return assets
}

/**
 * Templates 편집 폼(Admin)의 jsonTemplate 시각 미리보기 + 요소 편집 UI 필드.
 * 폼의 jsonTemplate 값을 그대로 구독하므로 가져오기·JSON 수동 편집과 항상 동기화된다.
 * 이미지 요소는 인가 에셋(브랜드 로고 등)으로 교체해야 하며, 교체 전에는 저장이 서버에서 거부된다.
 */
export default function TemplatePreviewField() {
	const { dispatchFields, setModified } = useForm()
	const jsonValue = useFormFields(([fields]) => fields.jsonTemplate?.value)
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const authorizedAssets = useAuthorizedAssets()

	const parsed = useMemo(() => jsonTemplateSchema.safeParse(jsonValue), [jsonValue])

	if (jsonValue == null) {
		return (
			<p style={{ color: 'var(--theme-elevation-500)', marginBottom: 'var(--base)' }}>
				jsonTemplate이 비어 있습니다. Figma에서 가져오면 미리보기가 표시됩니다.
			</p>
		)
	}

	if (!parsed.success) {
		return (
			<p style={{ color: 'var(--theme-error-500)', marginBottom: 'var(--base)' }}>
				jsonTemplate이 스키마(src/types/json-template.ts)와 맞지 않아 미리보기를 그릴 수
				없습니다.
			</p>
		)
	}

	const template = parsed.data
	const scale = Math.min(1, PREVIEW_MAX_WIDTH / template.width)
	const selected = template.elements.find((element) => element.id === selectedId)
	const unauthorizedCount = template.elements.filter(
		(element) => element.type === 'image' && element.assetCollection === 'template-assets',
	).length

	function updateTemplate(next: JsonTemplate) {
		dispatchFields({ type: 'UPDATE', path: 'jsonTemplate', value: next })
		setModified(true)
	}

	function updateSelected(patch: {
		locked?: boolean
		slotLabel?: string
		text?: string
		assetCollection?: AuthorizedAssetOption['collection']
		assetId?: number
		src?: string
	}) {
		if (!selected) {
			return
		}

		updateTemplate({
			...template,
			elements: template.elements.map((element) =>
				element.id === selected.id
					? ({ ...element, ...patch } as JsonTemplate['elements'][number])
					: element,
			),
		})
	}

	return (
		<div style={{ marginBottom: 'var(--base)' }}>
			{unauthorizedCount > 0 && (
				<p style={{ color: 'var(--theme-error-500)', marginBottom: 8, fontSize: 13 }}>
					인가되지 않은 이미지 {unauthorizedCount}개 (빨간 표시) — 브랜드 에셋으로
					교체해야 저장할 수 있습니다.
				</p>
			)}
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: 'var(--base)',
					alignItems: 'flex-start',
				}}
			>
				<div
					style={{ position: 'relative', border: '1px solid var(--theme-elevation-150)' }}
				>
					<TemplateRenderer template={template} scale={scale} />
					{/* 요소 선택 오버레이 — 렌더 위에 클릭 영역만 얹는다. */}
					{template.elements.map((element) => {
						const isSelected = element.id === selectedId
						const isUnauthorized =
							element.type === 'image' &&
							element.assetCollection === 'template-assets'

						return (
							<button
								type="button"
								key={element.id}
								onClick={() => setSelectedId(isSelected ? null : element.id)}
								aria-label={element.slotLabel || element.id}
								title={`${element.slotLabel || element.id}${isUnauthorized ? ' (비인가 — 교체 필요)' : element.locked ? ' (고정)' : ' (슬롯)'}`}
								style={{
									position: 'absolute',
									left: element.x * scale,
									top: element.y * scale,
									width: element.width * scale,
									height: element.height * scale,
									zIndex: element.zIndex + 1,
									padding: 0,
									background: 'transparent',
									cursor: 'pointer',
									border: isSelected
										? '2px solid var(--theme-success-400, #22c55e)'
										: isUnauthorized
											? '2px dashed var(--theme-error-500, #ef4444)'
											: element.locked
												? '1px dashed color-mix(in srgb, currentColor 25%, transparent)'
												: '1px dashed var(--theme-success-400, #22c55e)',
								}}
							/>
						)
					})}
				</div>

				{selected && (
					<div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 8 }}>
						<strong style={{ fontSize: 13 }}>
							{selected.type} · {selected.slotLabel || selected.id}
						</strong>
						<label
							style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}
						>
							<input
								type="checkbox"
								checked={!selected.locked}
								onChange={(event) =>
									updateSelected({ locked: !event.target.checked })
								}
							/>
							슬롯으로 열기 (Create에서 편집 허용)
						</label>
						<TextInput
							path="templatePreviewSlotLabel"
							label="슬롯 이름"
							value={selected.slotLabel ?? ''}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateSelected({ slotLabel: event.target.value })
							}
						/>
						{selected.type === 'text' && (
							<TextInput
								path="templatePreviewText"
								label="텍스트 내용"
								value={selected.text}
								onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
									updateSelected({ text: event.target.value })
								}
							/>
						)}
						{selected.type === 'image' && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
								<span style={{ fontSize: 13 }}>
									이미지 출처:{' '}
									{selected.assetCollection === 'template-assets' ? (
										<strong style={{ color: 'var(--theme-error-500)' }}>
											비인가 (임포트 조각)
										</strong>
									) : (
										<strong>
											{ASSET_COLLECTION_LABELS[selected.assetCollection]}
										</strong>
									)}
								</span>
								<label
									htmlFor="template-preview-asset-select"
									style={{ fontSize: 13 }}
								>
									인가 에셋으로 교체
								</label>
								<select
									id="template-preview-asset-select"
									value={
										selected.assetCollection === 'template-assets'
											? ''
											: `${selected.assetCollection}:${selected.assetId}`
									}
									onChange={(event) => {
										const [collection, id] = event.target.value.split(':')
										const asset = authorizedAssets.find(
											(item) =>
												item.collection === collection &&
												item.id === Number(id),
										)

										if (asset) {
											updateSelected({
												assetCollection: asset.collection,
												assetId: asset.id,
												src: asset.url,
											})
										}
									}}
									style={{ padding: 6 }}
								>
									<option value="" disabled>
										에셋 선택...
									</option>
									{AUTHORIZED_ASSET_COLLECTIONS.map((collection) => (
										<optgroup
											key={collection}
											label={ASSET_COLLECTION_LABELS[collection]}
										>
											{authorizedAssets
												.filter((asset) => asset.collection === collection)
												.map((asset) => (
													<option
														key={asset.id}
														value={`${asset.collection}:${asset.id}`}
													>
														{asset.name}
													</option>
												))}
										</optgroup>
									))}
								</select>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
