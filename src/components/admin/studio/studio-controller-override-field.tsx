'use client'

import { FieldDescription, FieldError, FieldLabel, useField, useFormFields } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
import type { ComponentProps } from 'react'
import { deriveTemplateBaseControllerGroups } from '@/features/template-customization/domain/template-config'
import type {
	ControllerControlDefinition,
	ControllerControlOverride,
	ControllerGroupDefinition,
	StudioControllerOverride,
} from '@/modules/studio-controller/controller-definition'
import type { TemplateNodeConfigMap } from '@/types/template'

type OverrideFieldProps = ComponentProps<JSONFieldClientComponent> & {
	source: 'graphic' | 'template'
	baseConfigs?: readonly {
		id: string
		controller: { groups: readonly ControllerGroupDefinition[] }
	}[]
}

/** Base Definition을 읽기 전용으로 보여주고 제약값만 sparse JSON으로 저장한다. */
export function StudioControllerOverrideField({
	path,
	source,
	baseConfigs = [],
}: OverrideFieldProps) {
	const { disabled, errorMessage, setValue, showError, value } = useField<unknown>({ path })
	const runtime = useFormFields(([fields]) => fields.runtime?.value) as string | undefined
	const html = (useFormFields(([fields]) => fields.html?.value) as string | undefined) ?? ''
	const nodeConfigs = (useFormFields(([fields]) => fields.overrides?.value) ??
		{}) as TemplateNodeConfigMap
	const groups =
		source === 'graphic'
			? (baseConfigs.find((config) => config.id === runtime)?.controller.groups ?? [])
			: deriveTemplateBaseControllerGroups({ html, nodeConfigs })
	const current = readOverride(value)

	function update(controlId: string, patch: Partial<ControllerControlOverride>) {
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
				<p className="text-sm text-muted-foreground">
					{source === 'graphic'
						? 'Runtime을 선택하면 제한 가능한 컨트롤이 표시됩니다.'
						: 'Template HTML을 가져오면 제한 가능한 컨트롤이 표시됩니다.'}
				</p>
			) : (
				<div className="flex flex-col gap-4">
					{groups.map((group) => (
						<fieldset key={group.id} className="rounded-md border p-3">
							<legend className="px-1 text-sm font-semibold">{group.title}</legend>
							<div className="flex flex-col gap-3">
								{group.controls.map((control) => (
									<ControlOverrideEditor
										key={control.id}
										control={control}
										disabled={disabled}
										override={current.controls.find(
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

function ControlOverrideEditor({
	control,
	disabled,
	override,
	onChange,
}: {
	control: ControllerControlDefinition
	disabled?: boolean
	override?: ControllerControlOverride
	onChange: (patch: Partial<ControllerControlOverride>) => void
}) {
	const overridesDefault = override && Object.hasOwn(override, 'defaultValue')
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
					value={override?.availability ?? ''}
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
					value={override.defaultValue}
					onChange={(defaultValue) => onChange({ defaultValue })}
				/>
			) : null}
			{control.kind === 'text' ? (
				<NumberOverride
					label={`최대 글자 수 (원본 ${control.maxLength ?? '없음'})`}
					value={override?.maxLength}
					disabled={disabled}
					onChange={(maxLength) => onChange({ maxLength })}
				/>
			) : null}
			{control.kind === 'range' ? (
				<>
					<NumberOverride
						label={`최솟값 (원본 ${control.min})`}
						value={override?.min}
						disabled={disabled}
						onChange={(min) => onChange({ min })}
					/>
					<NumberOverride
						label={`최댓값 (원본 ${control.max})`}
						value={override?.max}
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
							const selected = override?.optionValues?.includes(option.value) ?? true
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
												override?.optionValues ??
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
	value: ControllerControlOverride['defaultValue']
	onChange: (value: ControllerControlOverride['defaultValue']) => void
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

function NumberOverride({
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

function readOverride(value: unknown): StudioControllerOverride {
	if (
		!value ||
		typeof value !== 'object' ||
		!Array.isArray((value as { controls?: unknown }).controls)
	) {
		return { controls: [] }
	}
	return value as StudioControllerOverride
}
