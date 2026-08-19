'use client'

import type { ReactNode } from 'react'
import { Controller } from '@/components/shared/controller'
import { FieldError } from '@/components/ui/field'
import type {
	ControllerControlDefinition,
	ControllerControlValue,
	ControllerGroupDefinition,
	ControllerGroupPresentation,
	ControllerRuntimeBinding,
	ControllerRuntimeBindings,
	ControllerValues,
} from '@/modules/studio-controller/controller-definition'
import {
	isControllerPadValue,
	resolveControllerAvailability,
} from '@/modules/studio-controller/controller-definition'

/**
 * toggle(boolean)의 표현은 세그먼트 On|Off 하나뿐이다 — 계약 밖 boolean 행(레이어 가시성)도 이걸 쓴다.
 * 순서는 디자인 SSOT(Figma HD_LBS_UI 4:5822 "Toggle")가 정한다 — On이 왼쪽이다.
 */
export const CONTROLLER_TOGGLE_OPTIONS = [
	{ value: 'on', label: 'On' },
	{ value: 'off', label: 'Off' },
] as const

type ControllerRendererProps = {
	groups: readonly ControllerGroupDefinition[]
	presentation?: { groups: readonly ControllerGroupPresentation[] }
	values: ControllerValues
	bindings?: ControllerRuntimeBindings
	onChange: (controlId: string, value: ControllerControlValue) => void
}

/** 직렬화된 Definition과 세션 값을 도메인 지식 없이 Controller primitive로 투영한다. */
export function ControllerRenderer({
	groups,
	presentation,
	values,
	bindings,
	onChange,
}: ControllerRendererProps) {
	return (
		<>
			{groups.map((group, index) => {
				const content = group.controls.map((control) => (
					<ControllerControlRenderer
						key={control.id}
						definition={control}
						value={control.id in values ? values[control.id] : control.defaultValue}
						binding={bindings?.[control.id]}
						onChange={(value) => onChange(control.id, value)}
					/>
				))

				return (
					<ControllerGroupRenderer
						key={group.id}
						definition={group}
						first={index === 0}
						presentation={presentation?.groups.find(
							({ groupId }) => groupId === group.id,
						)}
					>
						{content}
					</ControllerGroupRenderer>
				)
			})}
		</>
	)
}

/** bespoke slot/feature layout에서도 Definition의 그룹 제목·접힘 정책을 그대로 투영한다. */
export function ControllerGroupRenderer({
	definition,
	presentation,
	children,
	first = false,
}: {
	definition: ControllerGroupDefinition
	presentation?: ControllerGroupPresentation
	children: ReactNode
	first?: boolean
}) {
	return (presentation?.collapsible ?? true) ? (
		<Controller.Group
			title={definition.title}
			collapsible
			defaultOpen={presentation?.defaultOpen ?? true}
			className={first ? 'border-t-0' : undefined}
		>
			{children}
		</Controller.Group>
	) : (
		<Controller.Group
			title={definition.title}
			collapsible={false}
			className={first ? 'border-t-0' : undefined}
		>
			{children}
		</Controller.Group>
	)
}

type ControllerControlRendererProps = {
	definition: ControllerControlDefinition
	value: ControllerControlValue
	binding?: ControllerRuntimeBinding
	onChange: (value: ControllerControlValue) => void
}

/** custom layout에서도 같은 availability·error·readonly·Pad 투영을 재사용하는 단일 control renderer. */
export function ControllerControlRenderer({
	definition,
	value,
	binding,
	onChange,
}: ControllerControlRendererProps) {
	return (
		<div data-slot="controller-renderer-control" className="flex flex-col gap-1">
			<ControllerControl
				definition={definition}
				value={value}
				availability={resolveControllerAvailability(
					definition.availability,
					binding?.availability,
				)}
				padAspectRatio={binding?.padAspectRatio}
				onChange={onChange}
			/>
			{binding?.error && <FieldError>{binding.error}</FieldError>}
		</div>
	)
}

type ControllerControlProps = {
	definition: ControllerControlDefinition
	value: ControllerControlValue
	availability: ReturnType<typeof resolveControllerAvailability>
	padAspectRatio?: number
	onChange: (value: ControllerControlValue) => void
}

function ControllerControl({
	definition,
	value,
	availability,
	padAspectRatio,
	onChange,
}: ControllerControlProps) {
	const disabled = availability === 'disabled'
	const readonly = availability === 'readonly'

	switch (definition.kind) {
		case 'text': {
			const text = typeof value === 'string' ? value : ''
			if (readonly) return <ReadonlyRow label={definition.label} value={text || '—'} />
			if (definition.multiline) {
				return (
					<Controller.Field
						label={definition.label}
						counter={
							definition.maxLength
								? `${text.length}/${definition.maxLength}`
								: undefined
						}
						disabled={disabled}
					>
						<Controller.Textarea
							value={text}
							maxLength={definition.maxLength}
							placeholder={definition.placeholder}
							onChange={(event) => onChange(event.target.value)}
						/>
					</Controller.Field>
				)
			}
			return (
				<Controller.Row label={definition.label} disabled={disabled}>
					<Controller.Input
						value={text}
						maxLength={definition.maxLength}
						placeholder={definition.placeholder}
						onChange={(event) => onChange(event.target.value)}
					/>
				</Controller.Row>
			)
		}
		case 'toggle': {
			const enabled = value === true
			if (readonly)
				return <ReadonlyRow label={definition.label} value={enabled ? 'On' : 'Off'} />
			return (
				<Controller.Row label={definition.label} disabled={disabled}>
					<Controller.Segmented
						aria-label={definition.label}
						options={CONTROLLER_TOGGLE_OPTIONS}
						value={enabled ? 'on' : 'off'}
						onChange={(next) => onChange(next === 'on')}
					/>
				</Controller.Row>
			)
		}
		case 'select': {
			const selected = typeof value === 'string' ? value : undefined
			const selectedLabel =
				definition.options.find((option) => option.value === selected)?.label ?? '—'
			if (!disabled && (readonly || definition.options.length <= 1)) {
				return <ReadonlyRow label={definition.label} value={selectedLabel} />
			}
			return (
				<Controller.Row label={definition.label} disabled={disabled}>
					<Controller.Select
						options={definition.options}
						value={selected}
						placeholder={definition.placeholder}
						onChange={onChange}
					/>
				</Controller.Row>
			)
		}
		case 'color': {
			const color = typeof value === 'string' ? value : null
			if (readonly) return <ReadonlyRow label={definition.label} value={color ?? '—'} />
			return (
				<Controller.ColorRow
					label={definition.label}
					value={color ?? '#000000'}
					isEmpty={color === null}
					values={definition.values}
					disabled={disabled}
					onReset={() => onChange(null)}
					onChange={onChange}
				/>
			)
		}
		case 'range': {
			const number = typeof value === 'number' ? value : definition.defaultValue
			const format = (next: number) => formatRange(next, definition.display)
			if (readonly) return <ReadonlyRow label={definition.label} value={format(number)} />
			return (
				<Controller.Range
					label={definition.label}
					value={number}
					min={definition.min}
					max={definition.max}
					step={definition.step}
					format={format}
					disabled={disabled}
					onChange={onChange}
				/>
			)
		}
		case 'pad': {
			const point = isControllerPadValue(value) ? value : definition.defaultValue
			if (readonly) {
				return (
					<ReadonlyRow
						label={definition.label}
						value={`${Math.round(point.x * 100)}, ${Math.round(point.y * 100)}`}
					/>
				)
			}
			return (
				<Controller.Pad
					aria-label={definition.label}
					value={point}
					aspectRatio={padAspectRatio ?? definition.aspectRatio}
					disabled={disabled}
					onChange={onChange}
				/>
			)
		}
	}
}

function ReadonlyRow({ label, value }: { label: string; value: string }) {
	return (
		<Controller.Row label={label} readonly>
			<span className="text-sm text-muted-foreground">{value}</span>
		</Controller.Row>
	)
}

function formatRange(value: number, display?: { unit?: string; precision?: number }) {
	return `${display?.precision === undefined ? value : value.toFixed(display.precision)}${display?.unit ?? ''}`
}
