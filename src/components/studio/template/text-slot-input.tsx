'use client'

import { Controller } from '@/components/studio/shared/controller'
import { Typography } from '@/components/ui/typography'
import type { TemplateSlotSpec } from '@/types/template'

type TextSlotInputProps = {
	label: string
	spec: TemplateSlotSpec
	value: string
	onChange: (text: string) => void
}

/** 제작자가 요소에 설정한 입력 제약(형식·글자수·줄수)을 적용한 텍스트 슬롯 컨트롤러 행. */
export function TextSlotInput({ label, spec, value, onChange }: TextSlotInputProps) {
	const format = spec.inputFormat ?? 'free'

	// 한 줄 제약(maxLines 1)의 자유 텍스트는 여러 줄 입력 UI가 성립하지 않는다 — 단일행 Input으로 렌더.
	if (format !== 'free' || spec.maxLines === 1) {
		const isInvalidEmail = format === 'email' && value !== '' && !/^\S+@\S+\.\S+$/.test(value)

		return (
			<>
				<Controller.Row label={label}>
					<Controller.Input
						type={format === 'free' ? 'text' : format}
						maxLength={spec.maxLength}
						placeholder={spec.placeholder ?? spec.label}
						value={value}
						onChange={(event) => onChange(event.target.value)}
						className="text-right"
					/>
				</Controller.Row>
				{isInvalidEmail && (
					<Typography role="alert" size="sm" tone="destructive">
						이메일 형식이 아니에요.
					</Typography>
				)}
			</>
		)
	}

	return (
		<Controller.Field label={label}>
			<Controller.Textarea
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
			/>
		</Controller.Field>
	)
}
