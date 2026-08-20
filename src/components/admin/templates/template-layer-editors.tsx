'use client'

import { toast } from '@payloadcms/ui'
import { type ReactNode, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Field,
	FieldDescription,
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
import { Textarea } from '@/components/ui/textarea'
import {
	type ImageProfileOption,
	requestPublishedImageProfiles,
} from '@/features/image-generation/services/generate-image.client'
import type { TemplateLayerAccess, TemplateNodeConfig, TemplateSlotSpec } from '@/types/template'
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
 * 예전 고정(profileId) 저장값을 허용 목록 한 개로 읽는다 — 고정 저작 UI는 간소화로 제거했고,
 * 허용 목록에 하나만 켠 것이 고정과 같다. 도메인 읽기 경로(pinned 투영)는 남아 있으므로,
 * 편집기가 커밋할 때 profileId를 지워 허용 목록으로 수렴시킨다.
 */
export function imageSlotAllowedProfileIds(imageInput: ImageSlotInput): number[] | undefined {
	return imageInput.profileId ? [imageInput.profileId] : imageInput.allowedProfileIds
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
	const allowed = imageSlotAllowedProfileIds(imageInput)
	return (
		<FieldGroup className="max-w-sm rounded-md border p-3">
			<FieldSet className="gap-2">
				<FieldLegend variant="label">허용 프로파일 — 고르지 않으면 전부</FieldLegend>
				<div className="flex flex-wrap gap-2">
					{profiles?.map((profile) => {
						const all = profiles.map((candidate) => candidate.id)
						const on = (allowed ?? all).includes(profile.id)
						return (
							<Button
								key={profile.id}
								type="button"
								size="sm"
								aria-pressed={on}
								variant={on ? 'muted' : 'outline'}
								onClick={() => {
									const { profileId: _legacy, ...rest } = imageInput
									onChange({
										...rest,
										allowedProfileIds: toggleAllowedId(
											allowed,
											all,
											profile.id,
										),
									})
								}}
							>
								{profile.name}
							</Button>
						)
					})}
				</div>
			</FieldSet>
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
			{access !== 'hidden' && (
				<ImageSlotSpecEditor
					imageInput={config.imageInput ?? {}}
					profiles={profiles}
					onChange={(imageInput) => onCommit({ imageInput })}
				/>
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
