'use client'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { ROW_SELECT_TRIGGER } from './classes'
import { useRowControl } from './row'

type ControllerSelectProps = {
	options: readonly { value: string; label: string }[]
	value?: string
	onChange?: (value: string) => void
	placeholder?: string
	/** Row 안에서는 행의 disabled를 자동으로 따른다 — 목록이 비었을 때 등 자체 사유만 명시한다. */
	disabled?: boolean
}

/** 행 안에 투명하게 앉는 셀렉트 — 라벨 연결 id와 disabled를 Row에서 이어받는다. */
export function ControllerSelect({
	options,
	value,
	onChange,
	placeholder,
	disabled,
}: ControllerSelectProps) {
	const row = useRowControl()
	return (
		<Select value={value} onValueChange={(next) => onChange?.(next)}>
			<SelectTrigger
				id={row?.controlId}
				size="sm"
				disabled={disabled || row?.disabled}
				className={ROW_SELECT_TRIGGER}
			>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			{options.length > 0 && (
				<SelectContent align="end">
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			)}
		</Select>
	)
}
