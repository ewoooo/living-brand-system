'use client'

import { MagicWand } from '@carbon/icons-react'
import { Popup, toast } from '@payloadcms/ui'
import { type ComponentProps, type ReactNode, useEffect, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
	FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import {
	type ImageAspectRatio,
	nearestImageAspectRatio,
} from '@/features/image-generation/image-size'
import {
	type ImageProfileOption,
	requestAdminImageGeneration,
	requestPublishedImageProfiles,
} from '@/features/image-generation/services/generate-image.client'
import { IDENTITY_TRANSFORM, isIdentityTransform } from '@/lib/template-image-transform'
import type { TemplateLayerAccess, TemplateNodeConfig, TemplateSlotSpec } from '@/types/template'
import { BrandColorSwatches, usePublishedBrandColors } from './brand-color-swatches'
import type { ImageTransform } from './image-transform-gestures'
import {
	canAssignImage,
	IMAGE_CONFIG_KEYS,
	type LayerRow,
	toggleAllowedId,
	typeLabel,
} from './template-layers'
import { VectorLayerEditor } from './vector-layer-editor'

function usePublishedImageProfiles() {
	const [profiles, setProfiles] = useState<ImageProfileOption[] | null>(null)
	useEffect(() => {
		void requestPublishedImageProfiles()
			.then(setProfiles)
			.catch(() => {
				setProfiles([])
				toast.error('이미지 프로파일을 불러오지 못했습니다.')
			})
	}, [])
	return profiles
}

function AiPopupTrigger({ render }: { render: ComponentProps<typeof Popup>['render'] }) {
	return (
		<Popup
			buttonType="custom"
			buttonClassName={buttonVariants({ variant: 'outline', size: 'sm' })}
			verticalAlign="top"
			horizontalAlign="left"
			size="fit-content"
			button={
				<>
					<MagicWand data-icon="inline-start" aria-hidden /> AI 생성
				</>
			}
			render={render}
		/>
	)
}

function AiImageForm({
	aspectRatio,
	onApply,
	profiles,
}: {
	aspectRatio?: ImageAspectRatio
	onApply: (image: { id: number; src: string }) => void
	profiles: ImageProfileOption[] | null
}) {
	const [prompt, setPrompt] = useState('')
	const [loading, setLoading] = useState(false)
	const [pickedProfileId, setPickedProfileId] = useState<number>()
	const profileId = pickedProfileId ?? profiles?.[0]?.id

	async function run() {
		const trimmed = prompt.trim()
		if (!trimmed || !profileId || loading) return
		setLoading(true)
		try {
			const result = await requestAdminImageGeneration({
				prompt: trimmed,
				count: 1,
				profileId,
				aspectRatio,
			})
			const generated = result.generatedImages?.[0]
			if (generated) onApply({ id: generated.id, src: generated.url })
			else toast.error('이미지 생성 실패 — 잠시 후 다시 시도하세요.')
		} catch {
			toast.error('이미지 생성 실패 — 잠시 후 다시 시도하세요.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<FieldGroup data-popup-prevent-close className="w-64 gap-2 p-2">
			<Field>
				<FieldLabel htmlFor="template-ai-image-profile">이미지 프로파일</FieldLabel>
				<Select
					value={profileId ? String(profileId) : undefined}
					onValueChange={(value) => setPickedProfileId(Number(value))}
				>
					<SelectTrigger
						id="template-ai-image-profile"
						className="w-full"
						disabled={!profiles?.length}
					>
						<SelectValue
							placeholder={profiles ? '발행된 프로파일 없음' : '프로파일 불러오는 중'}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{profiles?.map((profile) => (
								<SelectItem key={profile.id} value={String(profile.id)}>
									{profile.name}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				{aspectRatio && <FieldDescription>슬롯 비율 {aspectRatio}로 생성</FieldDescription>}
			</Field>
			<Field>
				<FieldLabel htmlFor="template-ai-image-prompt">생성 프롬프트</FieldLabel>
				<Textarea
					id="template-ai-image-prompt"
					value={prompt}
					onChange={(event) => setPrompt(event.target.value)}
					rows={3}
					placeholder="예: 미니멀한 파스텔 그라디언트 배경"
				/>
			</Field>
			<Button
				type="button"
				variant="tint"
				size="sm"
				disabled={loading || !profileId || !prompt.trim()}
				onClick={run}
			>
				{loading && <Spinner data-icon="inline-start" />}
				{loading ? '생성 중...' : '생성'}
			</Button>
		</FieldGroup>
	)
}

function SpecField({
	id,
	label,
	span,
	children,
}: {
	id: string
	label: string
	span?: boolean
	children: ReactNode
}) {
	return (
		<Field className={span ? 'md:col-span-3' : undefined}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			{children}
		</Field>
	)
}

function CreatorLayerPolicyEditor({
	access,
	config,
	onChange,
}: {
	access: TemplateLayerAccess
	config: TemplateNodeConfig
	onChange: (patch: TemplateNodeConfig) => void
}) {
	const visibility = config.creator?.visibility
	return (
		<FieldGroup className="mt-3 max-w-xl gap-3 rounded-md border p-3">
			<Field>
				<FieldLabel htmlFor="template-layer-access">Creator 사용 상태</FieldLabel>
				<Select
					value={access}
					onValueChange={(next) =>
						onChange({
							creator: {
								access: next as TemplateLayerAccess,
								...(next === 'editable' && visibility ? { visibility } : {}),
							},
						})
					}
				>
					<SelectTrigger id="template-layer-access" className="w-full max-w-sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectItem value="hidden">숨김 — 패널에 표시 안 함</SelectItem>
							<SelectItem value="readonly">읽기 전용</SelectItem>
							<SelectItem value="editable">편집 가능</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
			</Field>
			{access === 'editable' && (
				<>
					<Field orientation="horizontal" className="w-fit">
						<Checkbox
							id="template-layer-default-visible"
							checked={visibility?.defaultVisible ?? true}
							onCheckedChange={(checked) =>
								onChange({
									creator: {
										access,
										visibility: {
											...visibility,
											defaultVisible: checked === true,
										},
									},
								})
							}
						/>
						<FieldLabel htmlFor="template-layer-default-visible">기본 표시</FieldLabel>
					</Field>
					<Field orientation="horizontal" className="w-fit">
						<Checkbox
							id="template-layer-visibility-toggle"
							checked={visibility?.allowToggle ?? false}
							onCheckedChange={(checked) =>
								onChange({
									creator: {
										access,
										visibility: {
											...visibility,
											allowToggle: checked === true,
										},
									},
								})
							}
						/>
						<FieldLabel htmlFor="template-layer-visibility-toggle">
							Creator가 표시/숨김 변경 가능
						</FieldLabel>
					</Field>
				</>
			)}
		</FieldGroup>
	)
}

function SlotSpecEditor({
	input,
	onChange,
}: {
	input: TemplateSlotSpec
	onChange: (input: TemplateSlotSpec) => void
}) {
	const patch = (part: Partial<TemplateSlotSpec>) => onChange({ ...input, ...part })
	const positiveInt = (raw: string) => {
		const parsed = Number.parseInt(raw, 10)
		return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
	}

	return (
		<FieldGroup className="grid max-w-xl grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
			<SpecField id="slot-spec-label" label="라벨">
				<Input
					id="slot-spec-label"
					value={input.label ?? ''}
					onChange={(event) => patch({ label: event.target.value || undefined })}
					placeholder="예: 영문 이름"
				/>
			</SpecField>
			<SpecField id="slot-spec-placeholder" label="플레이스홀더">
				<Input
					id="slot-spec-placeholder"
					value={input.placeholder ?? ''}
					onChange={(event) => patch({ placeholder: event.target.value || undefined })}
					placeholder="입력 전 안내 문구"
				/>
			</SpecField>
			<SpecField id="slot-spec-format" label="형식">
				<Select
					value={input.inputFormat ?? 'free'}
					onValueChange={(value) =>
						patch({ inputFormat: value as TemplateSlotSpec['inputFormat'] })
					}
				>
					<SelectTrigger id="slot-spec-format" className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectItem value="free">자유 텍스트</SelectItem>
							<SelectItem value="number">숫자</SelectItem>
							<SelectItem value="email">이메일</SelectItem>
							<SelectItem value="date">날짜</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
			</SpecField>
			<SpecField id="slot-spec-max-length" label="최대 글자">
				<Input
					type="number"
					min={1}
					id="slot-spec-max-length"
					value={input.maxLength ?? ''}
					onChange={(event) => patch({ maxLength: positiveInt(event.target.value) })}
					placeholder="없음"
				/>
			</SpecField>
			<SpecField id="slot-spec-max-lines" label="최대 줄">
				<Input
					type="number"
					min={1}
					id="slot-spec-max-lines"
					value={input.maxLines ?? ''}
					onChange={(event) => patch({ maxLines: positiveInt(event.target.value) })}
					placeholder="없음"
				/>
			</SpecField>
			<SpecField id="slot-spec-ai" label="AI 지시 — 이 슬롯의 생성 규칙" span>
				<Textarea
					id="slot-spec-ai"
					value={input.aiInstruction ?? ''}
					onChange={(event) => patch({ aiInstruction: event.target.value || undefined })}
					rows={2}
					placeholder="예: 영문 이름만, 성-이름 순"
				/>
			</SpecField>
		</FieldGroup>
	)
}

type ImageSlotInput = NonNullable<TemplateNodeConfig['imageInput']>

/**
 * 프로파일 셀렉트 값을 imageInput에 반영한다 — profileId만 갈아끼우고 allowedProfileIds·transform은 보존한다.
 * 예전엔 이 셀렉트가 imageInput 전체를 교체해 옆 필드(허용 프로파일·창작자 변형 허용)를 조용히 지웠다.
 */
export function applyImageSlotProfileSelection(
	imageInput: ImageSlotInput,
	value: string,
): ImageSlotInput {
	if (value === 'studio') {
		const { profileId: _dropped, ...rest } = imageInput
		return rest
	}
	return { ...imageInput, profileId: Number(value) }
}

function ImageSlotSpecEditor({
	imageInput,
	onChange,
	profiles,
}: {
	imageInput: ImageSlotInput
	onChange: (imageInput: ImageSlotInput) => void
	profiles: ImageProfileOption[] | null
}) {
	return (
		<FieldGroup className="max-w-sm rounded-md border p-3">
			<Field>
				<FieldLabel htmlFor="image-slot-profile">
					프로파일 고정 — 없으면 유저가 선택
				</FieldLabel>
				<Select
					value={imageInput.profileId ? String(imageInput.profileId) : 'studio'}
					onValueChange={(value) =>
						onChange(applyImageSlotProfileSelection(imageInput, value))
					}
				>
					<SelectTrigger id="image-slot-profile" className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectItem value="studio">스튜디오에서 선택</SelectItem>
							{profiles?.map((profile) => (
								<SelectItem key={profile.id} value={String(profile.id)}>
									{profile.name}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</Field>
			{imageInput.profileId ? null : (
				<FieldSet className="gap-2">
					<FieldLegend variant="label">허용 프로파일 — 고르지 않으면 전부</FieldLegend>
					<div className="flex flex-wrap gap-2">
						{profiles?.map((profile) => {
							const all = profiles.map((candidate) => candidate.id)
							const on = (imageInput.allowedProfileIds ?? all).includes(profile.id)
							return (
								<Button
									key={profile.id}
									type="button"
									size="sm"
									aria-pressed={on}
									variant={on ? 'muted' : 'outline'}
									onClick={() =>
										onChange({
											...imageInput,
											allowedProfileIds: toggleAllowedId(
												imageInput.allowedProfileIds,
												all,
												profile.id,
											),
										})
									}
								>
									{profile.name}
								</Button>
							)
						})}
					</div>
				</FieldSet>
			)}
			<Field>
				<FieldLabel htmlFor="image-slot-transform">창작자 변형 허용</FieldLabel>
				<Button
					id="image-slot-transform"
					type="button"
					size="sm"
					aria-pressed={imageInput.transform?.enabled ?? true}
					variant={(imageInput.transform?.enabled ?? true) ? 'muted' : 'outline'}
					onClick={() =>
						onChange({
							...imageInput,
							transform: { enabled: !(imageInput.transform?.enabled ?? true) },
						})
					}
				>
					{(imageInput.transform?.enabled ?? true) ? 'On' : 'Off'}
				</Button>
			</Field>
		</FieldGroup>
	)
}

function ImageTransformEditor({
	value,
	onChange,
}: {
	value?: ImageTransform
	onChange: (next?: ImageTransform) => void
}) {
	const [draft, setDraft] = useState<ImageTransform>(value ?? IDENTITY_TRANSFORM)
	const commit = (next: ImageTransform) => onChange(isIdentityTransform(next) ? undefined : next)

	useEffect(() => setDraft(value ?? IDENTITY_TRANSFORM), [value])

	const fields = [
		{ key: 'x', label: '이동 X (px)', min: -1000, max: 1000, step: 1 },
		{ key: 'y', label: '이동 Y (px)', min: -1000, max: 1000, step: 1 },
		{ key: 'scale', label: '확대', min: 0.2, max: 5, step: 0.05 },
		{ key: 'rotate', label: '회전 (deg)', min: -180, max: 180, step: 1 },
	] as const

	return (
		<FieldGroup className="grid max-w-xl grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-2">
			{fields.map(({ key, label, min, max, step }) => (
				<SpecField key={key} id={`image-transform-${key}`} label={label}>
					<div className="flex items-center gap-2">
						<input
							type="range"
							min={min}
							max={max}
							step={step}
							value={draft[key]}
							aria-label={label}
							className="min-w-0 flex-1"
							onChange={(event) =>
								setDraft({ ...draft, [key]: Number(event.target.value) })
							}
							onPointerUp={() => commit(draft)}
							onKeyUp={(event) => {
								if (
									[
										'ArrowDown',
										'ArrowLeft',
										'ArrowRight',
										'ArrowUp',
										'End',
										'Home',
										'PageDown',
										'PageUp',
									].includes(event.key)
								) {
									commit(draft)
								}
							}}
						/>
						<Input
							type="number"
							id={`image-transform-${key}`}
							min={min}
							max={max}
							step={step}
							value={draft[key]}
							className="w-20 shrink-0"
							onChange={(event) => {
								const parsed = Number(event.target.value)
								if (!Number.isFinite(parsed)) return
								const next = { ...draft, [key]: parsed }
								setDraft(next)
								commit(next)
							}}
						/>
					</div>
				</SpecField>
			))}
			<div className="md:col-span-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => {
						setDraft(IDENTITY_TRANSFORM)
						onChange(undefined)
					}}
				>
					초기화
				</Button>
			</div>
		</FieldGroup>
	)
}

type ImageColorize = NonNullable<TemplateNodeConfig['imageColorize']>

function ImageColorizeEditor({
	value,
	onChange,
}: {
	value?: ImageColorize
	onChange: (next?: ImageColorize) => void
}) {
	const [showBackground, setShowBackground] = useState(Boolean(value?.background))
	const { colors, loadError } = usePublishedBrandColors()
	const current: Partial<ImageColorize> = value ?? {}

	useEffect(() => setShowBackground(Boolean(value?.background)), [value?.background])

	const pick = (field: 'line' | 'background', hex: string) => {
		const next = { ...current, [field]: hex }
		if (next.line) {
			onChange(
				next.background
					? { line: next.line, background: next.background }
					: { line: next.line },
			)
		}
	}

	return (
		<div className="flex flex-col gap-3">
			{(showBackground
				? ([
						['line', '선 색'],
						['background', '배경 색'],
					] as const)
				: ([['line', '선 색']] as const)
			).map(([field, label]) => {
				const needsLine = field === 'background' && !current.line
				return (
					<BrandColorSwatches
						key={field}
						legend={needsLine ? `${label} — 선 색을 먼저 고르세요` : label}
						colors={colors}
						value={current[field]}
						onPick={(hex) => pick(field, hex)}
						disabled={needsLine}
					/>
				)
			})}
			{!showBackground && (
				<FieldDescription>
					배경 없이 선만 칠합니다(캔버스가 그대로 비칩니다)
				</FieldDescription>
			)}
			<Field orientation="horizontal" className="w-fit">
				<Checkbox
					id="image-colorize-background"
					checked={showBackground}
					onCheckedChange={(checked) => {
						const enabled = checked === true
						setShowBackground(enabled)
						if (!enabled && current.line) onChange({ line: current.line })
					}}
				/>
				<FieldLabel htmlFor="image-colorize-background">배경 직접 지정</FieldLabel>
			</Field>
			<div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => {
						setShowBackground(false)
						onChange(undefined)
					}}
				>
					해제
				</Button>
			</div>
			{loadError && <FieldError>브랜드 컬러를 불러오지 못했습니다.</FieldError>}
		</div>
	)
}

function ImageLayerEditor({
	access,
	config,
	onCommit,
	selected,
}: {
	access: TemplateLayerAccess
	config: TemplateNodeConfig
	onCommit: (patch: TemplateNodeConfig) => void
	selected: LayerRow
}) {
	const profiles = usePublishedImageProfiles()

	return (
		<div>
			<FieldTitle>배경 설정 — {selected.name}</FieldTitle>
			<div className="mt-2 flex flex-wrap gap-2">
				<AiPopupTrigger
					render={({ close }) => (
						<AiImageForm
							aspectRatio={nearestImageAspectRatio(
								selected.boxWidth ?? Number.NaN,
								selected.boxHeight ?? Number.NaN,
							)}
							profiles={profiles}
							onApply={(image) => {
								onCommit({
									backgroundImage: image.src,
									generatedImageId: image.id,
								})
								close()
							}}
						/>
					)}
				/>
			</div>
			{access !== 'hidden' && (
				<ImageSlotSpecEditor
					imageInput={config.imageInput ?? {}}
					profiles={profiles}
					onChange={(imageInput) => onCommit({ imageInput })}
				/>
			)}
			{config.backgroundImage && (
				<div className="mt-4 flex flex-col gap-3">
					<FieldTitle>이미지 편집 — 이동·확대·회전</FieldTitle>
					<ImageTransformEditor
						key={selected.id}
						value={config.imageTransform}
						onChange={(imageTransform) => onCommit({ imageTransform })}
					/>
					<FieldTitle>컬러 치환 — 선·배경 브랜드 컬러</FieldTitle>
					<ImageColorizeEditor
						key={`colorize-${selected.id}`}
						value={config.imageColorize}
						onChange={(imageColorize) => onCommit({ imageColorize })}
					/>
				</div>
			)}
		</div>
	)
}

export function TemplateLayerEditor({
	config,
	onCommit,
	selected,
}: {
	config: TemplateNodeConfig
	onCommit: (patch: TemplateNodeConfig) => void
	selected: LayerRow
}) {
	const access =
		config.creator?.access ??
		(selected.isText
			? config.input
				? 'editable'
				: 'hidden'
			: canAssignImage(selected)
				? config.imageInput
					? 'editable'
					: 'hidden'
				: 'hidden')
	const policy = (
		<CreatorLayerPolicyEditor
			access={access}
			config={config}
			onChange={(patch) => {
				const nextAccess = patch.creator?.access
				onCommit({
					...patch,
					...(nextAccess !== 'hidden' && selected.isText && !config.input
						? { input: {} }
						: {}),
					...(nextAccess !== 'hidden' && canAssignImage(selected) && !config.imageInput
						? { imageInput: {} }
						: {}),
				})
			}}
		/>
	)

	if (selected.isText) {
		return (
			<div>
				{policy}
				<FieldGroup className="gap-2">
					<Field>
						<FieldLabel htmlFor="template-layer-text">
							텍스트 편집 — {selected.name}
						</FieldLabel>
						<Textarea
							id="template-layer-text"
							value={selected.text}
							onChange={(event) => onCommit({ text: event.target.value })}
							rows={2}
						/>
					</Field>
				</FieldGroup>
				{access !== 'hidden' && (
					<SlotSpecEditor
						input={config.input ?? {}}
						onChange={(input) => onCommit({ input })}
					/>
				)}
			</div>
		)
	}

	if (canAssignImage(selected)) {
		return (
			<>
				{policy}
				<ImageLayerEditor
					access={access}
					config={config}
					onCommit={onCommit}
					selected={selected}
				/>
			</>
		)
	}

	if (selected.isVector) {
		return (
			<>
				{policy}
				<VectorLayerEditor name={selected.name} config={config} onChange={onCommit} />
			</>
		)
	}

	if (selected.imageAddress === 'parent') {
		return (
			<FieldDescription>
				이미지 배정은 부모 프레임에서 합니다 — 프레임 레이어를 선택하세요.
				{IMAGE_CONFIG_KEYS.some((key) => key in config) &&
					' 이 레이어에 남은 이전 배정이 있습니다 — 부모 프레임에서 다시 배정하면 정리됩니다.'}
			</FieldDescription>
		)
	}

	return (
		<FieldDescription>
			{selected.tag === 'img'
				? '이미지로 고정된 레이어입니다 — Figma에서 해당 속성을 정리하면 편집 가능하게 가져올 수 있습니다.'
				: `${typeLabel(selected.figmaType)} 레이어는 아직 편집할 값이 없습니다.`}
		</FieldDescription>
	)
}
