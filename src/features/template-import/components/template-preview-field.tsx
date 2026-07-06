'use client'

import {
	Button,
	CheckboxInput,
	SelectInput,
	TextInput,
	useForm,
	useFormFields,
	useListDrawer,
} from '@payloadcms/ui'
import { type CSSProperties, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import Moveable from 'react-moveable'
import { TemplateRenderer } from '@/components/template-renderer'
import { isUnauthorizedAssetCollection } from '@/features/template-import/utils/validate-authorized-assets'
import {
	AUTHORIZED_ASSET_COLLECTIONS,
	type JsonFlowElement,
	type JsonTemplate,
	type JsonTemplateElement,
	jsonTemplateSchema,
} from '@/types/json-template'

const PREVIEW_MAX_WIDTH = 640

// 인가 컬렉션 상수와 타입으로 연결 — 컬렉션이 늘면 라벨 누락이 컴파일 에러로 잡힌다.
const ASSET_COLLECTION_LABELS: Record<(typeof AUTHORIZED_ASSET_COLLECTIONS)[number], string> = {
	'brand-logos': '브랜드 로고',
	'application-images': '어플리케이션 이미지',
}

type AnyElement = JsonFlowElement | JsonTemplateElement

/** 스택 자식까지 포함해 id로 요소를 찾는다. */
function findElementById(elements: readonly AnyElement[], id: string): AnyElement | undefined {
	for (const element of elements) {
		if (element.id === id) {
			return element
		}
		if (element.type === 'stack') {
			const found = findElementById(element.children, id)

			if (found) {
				return found
			}
		}
	}

	return undefined
}

/** 스택 자식까지 포함해 id가 일치하는 요소에 patch를 적용한 새 트리를 만든다. */
function patchElementById<T extends AnyElement>(
	elements: readonly T[],
	id: string,
	patch: Record<string, unknown>,
): T[] {
	return elements.map((element) => {
		if (element.id === id) {
			return { ...element, ...patch } as T
		}
		if (element.type === 'stack') {
			return { ...element, children: patchElementById(element.children, id, patch) } as T
		}

		return element
	})
}

/** SelectInput onChange 공통 가드 — 허용값일 때만 apply를 호출한다. */
function selectOneOf<T extends string>(allowed: readonly T[], apply: (value: T) => void) {
	return (option: unknown) => {
		const value = (option as { value?: string } | null)?.value

		if (value && (allowed as readonly string[]).includes(value)) {
			apply(value as T)
		}
	}
}

/** 스택 하위까지 포함한 비인가 이미지 수 — 경고 배너와 오버레이 표시가 함께 쓴다. */
function countUnauthorizedImages(elements: readonly AnyElement[]): number {
	return elements.reduce((total, element) => {
		if (element.type === 'stack') {
			return total + countUnauthorizedImages(element.children)
		}
		if (element.type === 'image' && isUnauthorizedAssetCollection(element.assetCollection)) {
			return total + 1
		}

		return total
	}, 0)
}

function overlayButtonStyle(
	element: JsonTemplateElement,
	scale: number,
	isSelected: boolean,
	isUnauthorized: boolean,
): CSSProperties {
	return {
		position: 'absolute',
		left: element.x * scale,
		top: element.y * scale,
		width: element.width * scale,
		height: element.height * scale,
		zIndex: element.zIndex + 1,
		padding: 0,
		background: 'transparent',
		cursor: isSelected ? 'move' : 'pointer',
		touchAction: 'none',
		border: isSelected
			? 'none'
			: isUnauthorized
				? '2px dashed var(--theme-error-500, #ef4444)'
				: element.locked
					? '1px dashed color-mix(in srgb, currentColor 25%, transparent)'
					: '1px dashed var(--theme-success-400, #22c55e)',
	}
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
	// 인가 에셋 선택은 Payload 네이티브 컬렉션 목록 drawer로 연다.
	const [AssetListDrawer, , { closeDrawer, openDrawer }] = useListDrawer({
		collectionSlugs: [...AUTHORIZED_ASSET_COLLECTIONS],
	})
	// 선택된 오버레이 버튼 DOM — Moveable(드래그·리사이즈)의 타깃이 된다.
	const [moveableTarget, setMoveableTarget] = useState<HTMLElement | null>(null)

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
	const selected = selectedId ? findElementById(template.elements, selectedId) : undefined
	const unauthorizedCount = countUnauthorizedImages(template.elements)

	function updateTemplate(next: JsonTemplate) {
		dispatchFields({ type: 'UPDATE', path: 'jsonTemplate', value: next })
		setModified(true)
	}

	function updateSelected(patch: {
		locked?: boolean
		slotLabel?: string
		text?: string
		textFit?: 'fixed' | 'auto-width' | 'truncate'
		verticalAlign?: 'top' | 'middle' | 'bottom'
		color?: string
		fill?: string
		filter?: string
		maxLength?: number
		maxLines?: number
		inputFormat?: 'free' | 'number' | 'email' | 'date'
		objectFit?: 'cover' | 'contain' | 'fill'
		x?: number
		y?: number
		width?: number
		height?: number
		assetCollection?: (typeof AUTHORIZED_ASSET_COLLECTIONS)[number]
		assetId?: number
		src?: string
	}) {
		if (!selected) {
			return
		}

		updateTemplate({
			...template,
			elements: patchElementById(template.elements, selected.id, patch),
		})
	}

	return (
		<div style={{ marginBottom: 'var(--base)' }}>
			<AssetListDrawer
				onSelect={({ collectionSlug, doc }) => {
					closeDrawer()
					const assetId = Number(doc?.id)
					const src = typeof doc?.url === 'string' ? doc.url : null

					if (
						!src ||
						!Number.isFinite(assetId) ||
						!(AUTHORIZED_ASSET_COLLECTIONS as readonly string[]).includes(
							collectionSlug,
						)
					) {
						return
					}

					updateSelected({
						assetCollection:
							collectionSlug as (typeof AUTHORIZED_ASSET_COLLECTIONS)[number],
						assetId,
						src,
					})
				}}
			/>
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
						// 스택이면 하위 전체 검사 — 비인가 이미지를 품은 스택도 빨간 표시.
						const isUnauthorized = countUnauthorizedImages([element]) > 0

						return (
							<button
								type="button"
								key={element.id}
								ref={isSelected ? setMoveableTarget : undefined}
								onClick={() => setSelectedId(isSelected ? null : element.id)}
								aria-label={element.slotLabel || element.id}
								title={`${element.slotLabel || element.id}${isUnauthorized ? ' (비인가 — 교체 필요)' : element.locked ? ' (고정)' : ' (슬롯)'}`}
								style={overlayButtonStyle(
									element,
									scale,
									isSelected,
									isUnauthorized,
								)}
							/>
						)
					})}
					{/* 선택 요소의 이동·리사이즈 제스처는 Moveable이 담당한다. 좌표는 scale 역산 후 원본 px로 저장. */}
					{selected && moveableTarget && (
						<Moveable
							flushSync={flushSync}
							target={moveableTarget}
							draggable
							resizable
							keepRatio={false}
							origin={false}
							renderDirections={['se']}
							onDrag={(event) => {
								updateSelected({
									x: Math.round(event.left / scale),
									y: Math.round(event.top / scale),
								})
							}}
							onResize={(event) => {
								updateSelected({
									width: Math.max(1, Math.round(event.width / scale)),
									height: Math.max(1, Math.round(event.height / scale)),
								})
							}}
						/>
					)}
				</div>

				{selected && (
					<div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 8 }}>
						<strong style={{ fontSize: 13 }}>
							{selected.type} · {selected.slotLabel || selected.id}
						</strong>
						{selected.type === 'stack' ? (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
								<span style={{ fontSize: 13, color: 'var(--theme-elevation-500)' }}>
									{selected.direction === 'horizontal' ? '가로' : '세로'} 스택 —
									자식을 선택해 편집하세요.
								</span>
								{selected.children.map((child) => (
									<Button
										key={child.id}
										buttonStyle="secondary"
										size="small"
										onClick={() => setSelectedId(child.id)}
									>
										{child.type} · {child.slotLabel || child.id}
									</Button>
								))}
							</div>
						) : (
							<>
								<CheckboxInput
									id="template-preview-locked"
									label="슬롯으로 열기 (Create에서 편집 허용)"
									checked={!selected.locked}
									onToggle={(event) =>
										updateSelected({ locked: !event.target.checked })
									}
								/>
								<TextInput
									path="templatePreviewSlotLabel"
									label="슬롯 이름"
									value={selected.slotLabel ?? ''}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
										updateSelected({ slotLabel: event.target.value })
									}
								/>
							</>
						)}
						{selected.type === 'text' && (
							<>
								<ColorInput
									id="template-preview-text-color"
									label="텍스트 색상"
									value={selected.color}
									onChange={(color) => updateSelected({ color })}
								/>
								<TextInput
									path="templatePreviewText"
									label="텍스트 내용"
									value={selected.text}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
										updateSelected({ text: event.target.value })
									}
								/>
								<SelectInput
									name="templatePreviewTextFit"
									path="templatePreviewTextFit"
									label="텍스트 상자"
									isClearable={false}
									value={selected.textFit}
									options={[
										{ label: '고정 폭 (넘치면 줄바꿈)', value: 'fixed' },
										{ label: '자동 폭 (줄바꿈 없음)', value: 'auto-width' },
										{ label: '말줄임 (상자를 넘치면 …)', value: 'truncate' },
									]}
									onChange={selectOneOf(
										['fixed', 'auto-width', 'truncate'],
										(textFit) => updateSelected({ textFit }),
									)}
								/>
								<SelectInput
									name="templatePreviewVerticalAlign"
									path="templatePreviewVerticalAlign"
									label="세로 정렬 (줄바꿈 시 쌓임 기준)"
									isClearable={false}
									value={selected.verticalAlign}
									options={[
										{ label: '위 (아래로 쌓임)', value: 'top' },
										{ label: '중앙 (양쪽으로 쌓임)', value: 'middle' },
										{ label: '아래 (위로 쌓임)', value: 'bottom' },
									]}
									onChange={selectOneOf(
										['top', 'middle', 'bottom'],
										(verticalAlign) => updateSelected({ verticalAlign }),
									)}
								/>
								<SelectInput
									name="templatePreviewInputFormat"
									path="templatePreviewInputFormat"
									label="입력 형식"
									isClearable={false}
									value={selected.inputFormat}
									options={[
										{ label: '자유 입력', value: 'free' },
										{ label: '숫자', value: 'number' },
										{ label: '이메일', value: 'email' },
										{ label: '날짜', value: 'date' },
									]}
									onChange={selectOneOf(
										['free', 'number', 'email', 'date'],
										(inputFormat) => updateSelected({ inputFormat }),
									)}
								/>
								<div style={{ display: 'flex', gap: 8 }}>
									{(['maxLength', 'maxLines'] as const).map((constraint) => (
										<div key={constraint} style={{ flex: 1 }}>
											<TextInput
												path={`templatePreview-${constraint}`}
												label={
													constraint === 'maxLength'
														? '최대 글자수'
														: '최대 줄수'
												}
												placeholder="제한 없음"
												value={
													selected[constraint] != null
														? String(selected[constraint])
														: ''
												}
												onChange={(
													event: React.ChangeEvent<HTMLInputElement>,
												) => {
													const raw = event.target.value.trim()

													if (raw === '') {
														updateSelected({ [constraint]: undefined })
														return
													}

													const value = Number(raw)

													if (Number.isInteger(value) && value > 0) {
														updateSelected({ [constraint]: value })
													}
												}}
											/>
										</div>
									))}
								</div>
							</>
						)}
						{selected.type === 'image' && (
							<>
								<div style={{ display: 'flex', gap: 8 }}>
									{(['width', 'height'] as const).map((dimension) => (
										<div key={dimension} style={{ flex: 1 }}>
											<TextInput
												path={`templatePreview-${dimension}`}
												label={
													dimension === 'width'
														? '너비 (px)'
														: '높이 (px)'
												}
												value={String(selected[dimension])}
												onChange={(
													event: React.ChangeEvent<HTMLInputElement>,
												) => {
													const value = Number(event.target.value)

													if (Number.isFinite(value) && value > 0) {
														updateSelected({ [dimension]: value })
													}
												}}
											/>
										</div>
									))}
								</div>
								<SelectInput
									name="templatePreviewObjectFit"
									path="templatePreviewObjectFit"
									label="이미지 맞춤"
									isClearable={false}
									value={selected.objectFit}
									options={[
										{ label: '채우기 (프레임을 채우고 잘림)', value: 'cover' },
										{ label: '전체 보기 (잘림 없이 여백)', value: 'contain' },
										{ label: '늘리기 (비율 무시)', value: 'fill' },
									]}
									onChange={selectOneOf(
										['cover', 'contain', 'fill'],
										(objectFit) => updateSelected({ objectFit }),
									)}
								/>
								<ColorInput
									id="template-preview-image-color"
									label="로고 색상"
									value={selected.color ?? '#000000'}
									onChange={(color) =>
										updateSelected({ color, filter: undefined })
									}
								/>
								<Button
									buttonStyle="secondary"
									size="small"
									onClick={() =>
										updateSelected({ color: undefined, filter: undefined })
									}
								>
									원본 색상
								</Button>
								<SelectInput
									name="templatePreviewImageFilter"
									path="templatePreviewImageFilter"
									label="이미지 색상 보정"
									isClearable={false}
									value={imageFilterPreset(selected.filter)}
									options={[
										{ label: '원본', value: 'none' },
										{ label: '흰색', value: 'white' },
										{ label: '검정', value: 'black' },
									]}
									onChange={(option) => {
										const value = (option as { value?: string } | null)?.value

										if (value === 'none') {
											updateSelected({ filter: undefined })
										} else if (value === 'white') {
											updateSelected({ filter: 'brightness(0) invert(1)' })
										} else if (value === 'black') {
											updateSelected({ filter: 'brightness(0)' })
										}
									}}
								/>
								<span style={{ fontSize: 13 }}>
									이미지 출처:{' '}
									{isUnauthorizedAssetCollection(selected.assetCollection) ? (
										<strong style={{ color: 'var(--theme-error-500)' }}>
											비인가 (임포트 조각)
										</strong>
									) : (
										<strong>
											{ASSET_COLLECTION_LABELS[selected.assetCollection]}
										</strong>
									)}
								</span>
								<Button buttonStyle="secondary" onClick={openDrawer}>
									인가 에셋에서 선택
								</Button>
							</>
						)}
						{selected.type === 'rect' && (
							<ColorInput
								id="template-preview-rect-fill"
								label="채우기 색상"
								value={selected.fill}
								onChange={(fill) => updateSelected({ fill })}
							/>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

function ColorInput({
	id,
	label,
	value,
	onChange,
}: {
	id: string
	label: string
	value: string
	onChange: (value: string) => void
}) {
	return (
		<label
			htmlFor={id}
			style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}
		>
			{label}
			<input
				id={id}
				type="color"
				value={normalizeColor(value)}
				onChange={(event) => onChange(event.currentTarget.value)}
				style={{ width: '100%', height: 40 }}
			/>
		</label>
	)
}

function normalizeColor(value: string) {
	return /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'
}

function imageFilterPreset(filter?: string) {
	if (filter === 'brightness(0) invert(1)') {
		return 'white'
	}
	if (filter === 'brightness(0)') {
		return 'black'
	}
	return 'none'
}
