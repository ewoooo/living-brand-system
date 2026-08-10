'use client'

import { Controller } from '@/components/studio/shared/controller'
import { Typography } from '@/components/ui/typography'
import type { TemplateTextSlot } from '@/features/template-studio/template-config'

type TextSlotInputProps = {
	label: string
	/** 편집 계약의 text 컨트롤 — 형식·글자수·줄수 레인지를 어드민 정의가 소유한다. */
	control: TemplateTextSlot['control']
	value: string
	onChange: (text: string) => void
}

/** 편집 계약(config)의 입력 제약(형식·글자수·줄수)을 적용한 텍스트 슬롯 컨트롤러 행. */
export function TextSlotInput({ label, control, value, onChange }: TextSlotInputProps) {
	// 한 줄 제약(maxLines 1)의 자유 텍스트는 여러 줄 입력 UI가 성립하지 않는다 — 단일행 Input으로 렌더.
	if (control.format !== 'free' || control.maxLines === 1) {
		const isInvalidEmail =
			control.format === 'email' && value !== '' && !/^\S+@\S+\.\S+$/.test(value)

		return (
			<>
				<Controller.Row label={label}>
					<Controller.Input
						type={control.format === 'free' ? 'text' : control.format}
						maxLength={control.maxLength}
						placeholder={control.placeholder ?? label}
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
				maxLength={control.maxLength}
				placeholder={control.placeholder ?? label}
				rows={2}
				value={value}
				onChange={(event) => {
					const next = event.target.value

					// 명시적 줄 수 제한 — 자동 줄바꿈 초과분은 렌더가 Figma 텍스트 박스 규칙대로 처리한다
					// (고정 박스는 overflow:hidden clip, 말줄임 설정은 -webkit-line-clamp 「…」).
					if (control.maxLines && next.split('\n').length > control.maxLines) {
						return
					}
					onChange(next)
				}}
			/>
		</Controller.Field>
	)
}
