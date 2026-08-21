'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'
import { ControllerRow, useRowControl } from './row'

type ControllerColorRowProps = {
	label: string
	/** hex 색상 데이터(#rrggbb). 스타일이 아니라 props로 흐르는 데이터다(docs/09 §4 예외). */
	value: string
	onChange?: (hex: string) => void
	/** 아직 사용자가 정하지 않은 상태 — hex 대신 —를 보여 원본 값을 사칭하지 않는다. */
	isEmpty?: boolean
	/** 값이 정해진 뒤 원본으로 되돌리는 어포던스. isEmpty가 아닐 때만 그려진다. */
	onReset?: () => void
	/** 허용 색 목록(#rrggbb). 주면 네이티브 피커 대신 이 색들만 고르는 스와치 목록이 된다. */
	values?: readonly string[]
	disabled?: boolean
	className?: string
}

/** 색상 행 — hex 표기 + 네이티브 컬러 피커 스와치. */
export function ControllerColorRow({
	label,
	value,
	onChange,
	isEmpty = false,
	onReset,
	values,
	disabled,
	className,
}: ControllerColorRowProps) {
	return (
		// 라벨 클릭이 피커를 연다 — Row의 자동 배선이 label과 스와치 input을 잇는다.
		<ControllerRow label={label} disabled={disabled} className={className}>
			<span className="flex shrink-0 items-center gap-2">
				{!isEmpty && onReset && (
					<button
						type="button"
						aria-label={`${label} 원래 색으로 되돌리기`}
						onClick={onReset}
						className="rounded-sm text-muted-foreground text-xs outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
					>
						초기화
					</button>
				)}
				<span className="font-mono text-sm text-muted-foreground lowercase">
					{isEmpty ? '—' : value}
				</span>
				{values?.length ? (
					<ColorPalette
						value={value}
						values={values}
						onChange={onChange}
						isEmpty={isEmpty}
					/>
				) : (
					<ColorSwatchInput
						label={label}
						value={value}
						onChange={onChange}
						isEmpty={isEmpty}
					/>
				)}
			</span>
		</ControllerRow>
	)
}

/**
 * 팔레트가 정해진 색 행 — 같은 name의 네이티브 라디오로 그린다(방향키 이동을 브라우저가 준다).
 * `input[type=color]`은 목록 밖 색을 막을 수 없어 계약이 좁혀진 control에는 쓸 수 없다.
 */
function ColorPalette({
	value,
	values,
	onChange,
	isEmpty,
}: Required<Pick<ControllerColorRowProps, 'value' | 'values'>> &
	Pick<ControllerColorRowProps, 'onChange' | 'isEmpty'>) {
	const row = useRowControl()
	const groupName = useId()
	const selected = isEmpty ? null : value.toLowerCase()
	return (
		<span className="flex items-center gap-1">
			{values.map((candidate, index) => (
				<input
					key={candidate}
					// 행 라벨이 가리키는 것은 첫 스와치다 — 라벨 클릭이 팔레트로 포커스를 옮긴다.
					id={index === 0 ? row?.controlId : undefined}
					type="radio"
					name={groupName}
					aria-label={candidate}
					checked={selected === candidate.toLowerCase()}
					disabled={row?.disabled || undefined}
					onChange={() => onChange?.(candidate)}
					// 색은 데이터라 style로 흐른다(docs/09 §4 예외 — 아래 스와치 input과 같은 근거).
					style={{ backgroundColor: candidate }}
					className={cn(
						'size-5 shrink-0 cursor-pointer appearance-none rounded-sm border border-border outline-none disabled:cursor-not-allowed',
						'checked:ring-2 checked:ring-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30',
					)}
				/>
			))}
		</span>
	)
}

function ColorSwatchInput({
	label,
	value,
	onChange,
	isEmpty,
}: Pick<ControllerColorRowProps, 'label' | 'value' | 'onChange' | 'isEmpty'>) {
	const row = useRowControl()
	return (
		<input
			id={row?.controlId}
			type="color"
			aria-label={`${label} 색상 선택`}
			value={value}
			disabled={row?.disabled || undefined}
			onChange={(event) => onChange?.(event.target.value)}
			className={cn(
				'size-5 shrink-0 cursor-pointer appearance-none rounded-sm border border-border bg-transparent p-0 disabled:cursor-not-allowed [&::-webkit-color-swatch]:rounded-[inherit] [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0',
				// 미설정 스와치는 비워 보인다 — 검정을 사칭하지 않기 위해서다.
				isEmpty && 'opacity-30',
			)}
		/>
	)
}
