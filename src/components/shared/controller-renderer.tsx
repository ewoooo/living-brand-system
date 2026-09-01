'use client'

import type { ReactNode } from 'react'
import { Controller } from '@/components/shared/controller'
import type { ControllerGroupSectionProps } from '@/components/shared/controller/group'
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
	/** 첫 그룹의 위 구분선을 걷는다. 이 목록 앞에 다른 그룹이 서면 `false`를 준다. */
	first?: boolean
}

/** 직렬화된 Definition과 세션 값을 도메인 지식 없이 Controller primitive로 투영한다. */
export function ControllerRenderer({
	groups,
	presentation,
	values,
	bindings,
	onChange,
	first = true,
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
						first={first && index === 0}
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
	attached = false,
	section,
}: {
	definition: ControllerGroupDefinition
	presentation?: ControllerGroupPresentation
	children: ReactNode
	first?: boolean
	/**
	 * 앞 컨트롤을 소유하는 그룹의 하위 섹션으로 그린다 — 구분선을 걷고 여백만 둔다.
	 * 🔴 접히지 않는 그룹은 애초에 구분선이 없다(`Controller.Group`의 non-collapsible 갈래) —
	 *    그래서 이 값은 접히는 갈래에만 넘긴다.
	 */
	attached?: boolean
	/** 섹션 활성화 배선 — `Controller.Group`에 그대로 얹힌다(계약은 그쪽이 갖는다). */
	section?: ControllerGroupSectionProps
}) {
	return (presentation?.collapsible ?? true) ? (
		<Controller.Group
			title={definition.title}
			collapsible
			defaultOpen={presentation?.defaultOpen ?? true}
			attached={attached}
			{...section}
			className={first ? 'border-t-0' : undefined}
		>
			{children}
		</Controller.Group>
	) : (
		<Controller.Group
			title={definition.title}
			collapsible={false}
			{...section}
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
			// 🔑 선택지 전부가 색 조합이면 칩 그리드다 — 여기서는 라벨이 아니라 **색이 정보**라서
			//    목록도 pill도 무엇을 고르는지 보여주지 못한다. 계약이 부분 선언을 막지만,
			//    검증을 거치지 않은 정의도 화면이 죽지 않게 every로 판정한다(섞이면 목록으로 떨어진다).
			if (definition.options.every((option) => option.colors?.length)) {
				return (
					<Controller.ColorChips
						label={definition.label}
						options={definition.options}
						value={selected}
						disabled={disabled}
						onChange={onChange}
					/>
				)
			}
			// 🔑 선택지를 펼쳐 두는 축은 segmented다 — 드롭다운은 누르기 전까지 무엇이 있는지 숨긴다.
			//    값이 비어 있을 수 없으므로(항상 하나가 켜져 있다) 첫 선택지로 떨군다.
			if (definition.variant === 'segmented') {
				return (
					<Controller.Row label={definition.label} disabled={disabled}>
						<Controller.Segmented
							aria-label={definition.label}
							options={definition.options}
							value={
								selected && definition.options.some((o) => o.value === selected)
									? selected
									: (definition.defaultValue ?? definition.options[0].value)
							}
							onChange={onChange}
						/>
					</Controller.Row>
				)
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
