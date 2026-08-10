'use client'

import {
	INSPECTOR_BARE_INPUT,
	InspectorField,
	InspectorRow,
} from '@/components/studio/shared/inspector'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import type { TemplateSlotSpec } from '@/types/template'

type TextSlotInputProps = {
	id: string
	label: string
	spec: TemplateSlotSpec
	value: string
	onChange: (text: string) => void
}

/** 제작자가 요소에 설정한 입력 제약(형식·글자수·줄수)을 적용한 텍스트 슬롯 인스펙터 행. */
export function TextSlotInput({ id, label, spec, value, onChange }: TextSlotInputProps) {
	const format = spec.inputFormat ?? 'free'

	// 한 줄 제약(maxLines 1)의 자유 텍스트는 여러 줄 입력 UI가 성립하지 않는다 — 단일행 Input으로 렌더.
	if (format !== 'free' || spec.maxLines === 1) {
		const isInvalidEmail = format === 'email' && value !== '' && !/^\S+@\S+\.\S+$/.test(value)

		return (
			<>
				<InspectorRow label={label} htmlFor={id}>
					<Input
						id={id}
						type={format === 'free' ? 'text' : format}
						maxLength={spec.maxLength}
						placeholder={spec.placeholder ?? spec.label}
						value={value}
						onChange={(event) => onChange(event.target.value)}
						className={cn(INSPECTOR_BARE_INPUT, 'text-right')}
					/>
				</InspectorRow>
				{isInvalidEmail && (
					<Typography role="alert" size="sm" tone="destructive">
						이메일 형식이 아니에요.
					</Typography>
				)}
			</>
		)
	}

	return (
		<InspectorField label={label} htmlFor={id}>
			<Textarea
				id={id}
				maxLength={spec.maxLength}
				placeholder={spec.placeholder ?? spec.label}
				rows={2}
				value={value}
				onChange={(event) => {
					const next = event.target.value

					// 명시적 줄 수 제한 — 자동 줄바꿈 초과분은 렌더가 Figma 텍스트 박스 규칙대로 처리한다
					// (고정 박스는 overflow:hidden clip, 말줄임 설정은 -webkit-line-clamp 「…」).
					if (spec.maxLines && next.split('\n').length > spec.maxLines) {
						return
					}
					onChange(next)
				}}
				className={cn(INSPECTOR_BARE_INPUT, 'min-h-12')}
			/>
		</InspectorField>
	)
}
