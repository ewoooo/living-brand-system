'use client'

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
				<ColorSwatchInput
					label={label}
					value={value}
					onChange={onChange}
					isEmpty={isEmpty}
				/>
			</span>
		</ControllerRow>
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
