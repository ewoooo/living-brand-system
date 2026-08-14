'use client'

import { FieldDescription, FieldError, FieldLabel, useField, useFormFields } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
import type { ComponentProps } from 'react'
import { deriveImageProfileController } from '@/features/image-generation/domain/image-studio-config'
import {
	DEFAULT_IMAGE_MODEL_PRESET,
	type ImageModelPreset,
} from '@/features/image-generation/image-model'
import { getTemplateRuntimeManifest } from '@/features/template-customization/domain/template-config'
import type {
	ControllerControlDefinition,
	ControllerControlRestriction,
	ControllerGroupDefinition,
	StudioControllerRestrictions,
} from '@/modules/studio-controller/controller-definition'
import type { TemplateNodeConfigMap } from '@/types/template'

type ControllerAdminFieldProps = ComponentProps<JSONFieldClientComponent> & {
	source: 'graphic' | 'image' | 'template'
	baseConfigs?: readonly {
		id: string
		controller: { groups: readonly ControllerGroupDefinition[] }
	}[]
}

type StoredControllerPresentation = {
	groups: { groupId: string; collapsible?: boolean; defaultOpen?: boolean }[]
}

/** Runtime Manifest의 Controller projection을 읽기 전용으로 보여주고 제약값만 저장한다. */
export function StudioControllerRestrictionsField({
	path,
	source,
	baseConfigs = [],
}: ControllerAdminFieldProps) {
	const { disabled, errorMessage, setValue, showError, value } = useField<unknown>({ path })
	const groups = useAdminControllerGroups(source, baseConfigs)
	const current = readRestrictions(value)

	function update(controlId: string, patch: Partial<ControllerControlRestriction>) {
		const previous = current.controls.find((control) => control.controlId === controlId) ?? {
			controlId,
		}
		const next = { ...previous, ...patch }
		for (const [key, entry] of Object.entries(next)) {
			if (entry === undefined) delete next[key as keyof typeof next]
		}
		const controls = current.controls.filter((control) => control.controlId !== controlId)
		if (Object.keys(next).length > 1) controls.push(next)
		setValue({ controls })
	}

	return (
		<div className="field-type json mb-5">
			<FieldLabel label="Controller 제한" path={path} />
			<FieldError message={errorMessage} path={path} showError={showError} />
			{groups.length === 0 ? (
				<EmptyControllerMessage source={source} />
			) : (
				<div className="flex flex-col gap-4">
					{groups.map((group) => (
						<fieldset key={group.id} className="rounded-md border p-3">
							<legend className="px-1 text-sm font-semibold">{group.title}</legend>
							<div className="flex flex-col gap-3">
								{group.controls.map((control) => (
									<ControlRestrictionEditor
										key={control.id}
										control={control}
										disabled={disabled}
										restriction={current.controls.find(
											(candidate) => candidate.controlId === control.id,
										)}
										onChange={(patch) => update(control.id, patch)}
									/>
								))}
							</div>
						</fieldset>
					))}
				</div>
			)}
			<FieldDescription
				description="컨트롤 종류·라벨·표시 형식은 원본 Definition이 소유합니다. 여기서는 기본값과 실행 범위만 좁힙니다."
				path={path}
			/>
		</div>
	)
}

/** Runtime 그룹의 접힘 가능 여부와 최초 열림값만 Admin 정책으로 저장한다. */
export function StudioControllerPresentationField({
	path,
	source,
	baseConfigs = [],
}: ControllerAdminFieldProps) {
	const { disabled, errorMessage, setValue, showError, value } = useField<unknown>({ path })
	const groups = useAdminControllerGroups(source, baseConfigs)
	const current = readPresentation(value)
	const knownGroupIds = new Set(groups.map(({ id }) => id))
	const hasStaleGroups = current.groups.some(({ groupId }) => !knownGroupIds.has(groupId))

	function update(
		groupId: string,
		patch: Partial<{ collapsible: boolean; defaultOpen: boolean }>,
	) {
		const previous = current.groups.find((group) => group.groupId === groupId)
		const next = { ...previous, groupId, ...patch }
		const overrides = {
			...(next.collapsible === false ? { collapsible: false } : {}),
			...(next.collapsible !== false && next.defaultOpen === false
				? { defaultOpen: false }
				: {}),
		}
		const presentationGroups = current.groups.filter(
			(group) => group.groupId !== groupId && knownGroupIds.has(group.groupId),
		)
		if (Object.keys(overrides).length) presentationGroups.push({ groupId, ...overrides })
		setValue({ groups: presentationGroups })
	}

	return (
		<div className="field-type json mb-5">
			<FieldLabel label="Controller 표현" path={path} />
			<FieldError message={errorMessage} path={path} showError={showError} />
			{hasStaleGroups && (
				<button
					type="button"
					className="mb-3 text-sm text-destructive underline"
					disabled={disabled}
					onClick={() =>
						setValue({
							groups: current.groups.filter(({ groupId }) =>
								knownGroupIds.has(groupId),
							),
						})
					}
				>
					현재 Runtime에 없는 그룹 설정 정리
				</button>
			)}
			{groups.length === 0 ? (
				<EmptyControllerMessage source={source} />
			) : (
				<div className="flex flex-col gap-3">
					{groups.map((group) => {
						const policy = current.groups.find(({ groupId }) => groupId === group.id)
						const collapsible = policy?.collapsible ?? true
						const defaultOpen = collapsible ? (policy?.defaultOpen ?? true) : true
						return (
							<fieldset key={group.id} className="rounded-md border p-3">
								<legend className="px-1 text-sm font-semibold">
									{group.title}
								</legend>
								<div className="flex flex-wrap gap-4">
									<label className="flex items-center gap-2 text-sm">
										<input
											type="checkbox"
											checked={collapsible}
											disabled={disabled}
											onChange={(event) =>
												update(group.id, {
													collapsible: event.currentTarget.checked,
												})
											}
										/>
										접기 허용
									</label>
									<label className="flex items-center gap-2 text-sm">
										<input
											type="checkbox"
											checked={defaultOpen}
											disabled={disabled || !collapsible}
											onChange={(event) =>
												update(group.id, {
													defaultOpen: event.currentTarget.checked,
												})
											}
										/>
										처음 열기
									</label>
								</div>
							</fieldset>
						)
					})}
				</div>
			)}
			<FieldDescription
				description="현재 열림 상태는 Creator 화면이 로컬로 소유하며, 여기서는 접힘 가능 여부와 최초 열림값만 정합니다."
				path={path}
			/>
		</div>
	)
}

function useAdminControllerGroups(
	source: ControllerAdminFieldProps['source'],
	baseConfigs: NonNullable<ControllerAdminFieldProps['baseConfigs']>,
) {
	const runtime = useFormFields(([fields]) => fields.runtime?.value) as string | undefined
	const imageModelPreset =
		(useFormFields(([fields]) => fields.imageModelPreset?.value) as
			| ImageModelPreset
			| undefined) ?? DEFAULT_IMAGE_MODEL_PRESET
	const imageFeatures = useFormFields(([fields]) => fields.features?.value)
	const html = (useFormFields(([fields]) => fields.html?.value) as string | undefined) ?? ''
	const nodeConfigs = (useFormFields(([fields]) => fields.overrides?.value) ??
		{}) as TemplateNodeConfigMap
	return source === 'graphic'
		? (baseConfigs.find((config) => config.id === runtime)?.controller.groups ?? [])
		: source === 'image'
			? deriveImageProfileController(imageModelPreset, imageFeatures, undefined).groups
			: getTemplateRuntimeManifest({
					html,
					nodeConfigs,
				}).controller.groups
}

function EmptyControllerMessage({ source }: { source: ControllerAdminFieldProps['source'] }) {
	return (
		<p className="text-sm text-muted-foreground">
			{source === 'graphic'
				? 'Runtime을 선택하면 설정 가능한 그룹이 표시됩니다.'
				: source === 'image'
					? '이미지 기능을 선택하면 설정 가능한 그룹이 표시됩니다.'
					: 'Template HTML을 가져오면 설정 가능한 그룹이 표시됩니다.'}
		</p>
	)
}

function ControlRestrictionEditor({
	control,
	disabled,
	restriction,
	onChange,
}: {
	control: ControllerControlDefinition
	disabled?: boolean
	restriction?: ControllerControlRestriction
	onChange: (patch: Partial<ControllerControlRestriction>) => void
}) {
	const overridesDefault = restriction && Object.hasOwn(restriction, 'defaultValue')
	return (
		<div className="grid gap-2 rounded-md bg-muted/40 p-3 md:grid-cols-2">
			<div>
				<strong className="text-sm">{control.label}</strong>
				<div className="text-xs text-muted-foreground">{control.id}</div>
			</div>
			<label className="text-sm">
				사용 상태
				<select
					className="mt-1 block h-9 w-full rounded-md border bg-background px-2"
					disabled={disabled}
					value={restriction?.availability ?? ''}
					onChange={(event) =>
						onChange({
							availability:
								event.currentTarget.value === 'readonly' ||
								event.currentTarget.value === 'disabled'
									? event.currentTarget.value
									: undefined,
						})
					}
				>
					<option value="">원본 사용</option>
					<option value="readonly">읽기 전용</option>
					<option value="disabled">사용 안 함</option>
				</select>
			</label>
			<label className="flex items-center gap-2 text-sm">
				<input
					type="checkbox"
					checked={Boolean(overridesDefault)}
					disabled={disabled}
					onChange={(event) =>
						onChange({
							defaultValue: event.currentTarget.checked
								? control.defaultValue
								: undefined,
						})
					}
				/>
				기본값 재정의
			</label>
			{overridesDefault ? (
				<DefaultValueEditor
					control={control}
					disabled={disabled}
					value={restriction.defaultValue}
					onChange={(defaultValue) => onChange({ defaultValue })}
				/>
			) : null}
			{control.kind === 'text' ? (
				<NumberRestriction
					label={`최대 글자 수 (원본 ${control.maxLength ?? '없음'})`}
					value={restriction?.maxLength}
					disabled={disabled}
					onChange={(maxLength) => onChange({ maxLength })}
				/>
			) : null}
			{control.kind === 'range' ? (
				<>
					<NumberRestriction
						label={`최솟값 (원본 ${control.min})`}
						value={restriction?.min}
						disabled={disabled}
						onChange={(min) => onChange({ min })}
					/>
					<NumberRestriction
						label={`최댓값 (원본 ${control.max})`}
						value={restriction?.max}
						disabled={disabled}
						onChange={(max) => onChange({ max })}
					/>
				</>
			) : null}
			{control.kind === 'select' ? (
				<div className="md:col-span-2">
					<div className="mb-1 text-sm">허용 선택지</div>
					<div className="flex flex-wrap gap-3">
						{control.options.map((option) => {
							const selected =
								restriction?.optionValues?.includes(option.value) ?? true
							return (
								<label
									key={option.value}
									className="flex items-center gap-1.5 text-sm"
								>
									<input
										type="checkbox"
										checked={selected}
										disabled={disabled}
										onChange={() => {
											const values = new Set(
												restriction?.optionValues ??
													control.options.map(({ value }) => value),
											)
											if (selected) values.delete(option.value)
											else values.add(option.value)
											const optionValues = control.options
												.map(({ value }) => value)
												.filter((value) => values.has(value))
											onChange({
												optionValues:
													optionValues.length === control.options.length
														? undefined
														: optionValues,
											})
										}}
									/>
									{option.label}
								</label>
							)
						})}
					</div>
				</div>
			) : null}
		</div>
	)
}

function DefaultValueEditor({
	control,
	disabled,
	value,
	onChange,
}: {
	control: ControllerControlDefinition
	disabled?: boolean
	value: ControllerControlRestriction['defaultValue']
	onChange: (value: ControllerControlRestriction['defaultValue']) => void
}) {
	if (control.kind === 'toggle') {
		return (
			<label className="flex items-center gap-2 text-sm">
				<input
					type="checkbox"
					checked={value === true}
					disabled={disabled}
					onChange={(event) => onChange(event.currentTarget.checked)}
				/>
				기본 토글 값
			</label>
		)
	}
	if (control.kind === 'select') {
		return (
			<select
				className="h-9 rounded-md border bg-background px-2"
				disabled={disabled}
				value={typeof value === 'string' ? value : ''}
				onChange={(event) => onChange(event.currentTarget.value || null)}
			>
				<option value="">선택 없음</option>
				{control.options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		)
	}
	if (control.kind === 'pad') {
		const point = typeof value === 'object' && value ? value : control.defaultValue
		return (
			<div className="flex gap-2">
				{(['x', 'y'] as const).map((axis) => (
					<label key={axis} className="text-sm">
						{axis.toUpperCase()}
						<input
							type="number"
							min={-1}
							max={1}
							step="any"
							value={point[axis]}
							disabled={disabled}
							onChange={(event) =>
								onChange({ ...point, [axis]: Number(event.currentTarget.value) })
							}
							className="ml-1 h-9 w-24 rounded-md border bg-background px-2"
						/>
					</label>
				))}
			</div>
		)
	}
	const inputType =
		control.kind === 'range' ? 'number' : control.kind === 'color' ? 'color' : 'text'
	return (
		<input
			type={inputType}
			className="h-9 rounded-md border bg-background px-2"
			disabled={disabled}
			value={typeof value === 'string' || typeof value === 'number' ? value : ''}
			onChange={(event) =>
				onChange(
					control.kind === 'range'
						? Number(event.currentTarget.value)
						: event.currentTarget.value,
				)
			}
		/>
	)
}

function NumberRestriction({
	label,
	value,
	disabled,
	onChange,
}: {
	label: string
	value?: number
	disabled?: boolean
	onChange: (value: number | undefined) => void
}) {
	return (
		<label className="text-sm">
			{label}
			<input
				type="number"
				className="mt-1 block h-9 w-full rounded-md border bg-background px-2"
				disabled={disabled}
				value={value ?? ''}
				onChange={(event) =>
					onChange(
						event.currentTarget.value ? Number(event.currentTarget.value) : undefined,
					)
				}
			/>
		</label>
	)
}

function readRestrictions(value: unknown): StudioControllerRestrictions {
	if (
		!value ||
		typeof value !== 'object' ||
		!Array.isArray((value as { controls?: unknown }).controls)
	) {
		return { controls: [] }
	}
	return value as StudioControllerRestrictions
}

function readPresentation(value: unknown): StoredControllerPresentation {
	if (
		!value ||
		typeof value !== 'object' ||
		!Array.isArray((value as { groups?: unknown }).groups)
	) {
		return { groups: [] }
	}
	return value as StoredControllerPresentation
}
