'use client'

import { Controller } from '@/components/studio/shared/controller'
import { ControllerControlRenderer } from '@/components/studio/shared/controller-renderer'
import { Typography } from '@/components/ui/typography'
import type { TemplateTextSlot } from '@/features/template-customization/domain/template-config'
import type { ControllerControlDefinition } from '@/modules/studio-controller/controller-definition'

type TextSlotInputProps = {
	/** 공통 Controller Definition과 DOM 입력 binding을 합쳐 렌더한다. */
	definition: Extract<ControllerControlDefinition, { kind: 'text' }>
	input: TemplateTextSlot['input']
	value: string
	onChange: (text: string) => void
}

/** 편집 계약(config)의 입력 제약(형식·글자수·줄수)을 적용한 텍스트 슬롯 컨트롤러 행. */
export function TextSlotInput({ definition, input, value, onChange }: TextSlotInputProps) {
	if ((definition.availability ?? 'enabled') !== 'enabled') {
		return (
			<ControllerControlRenderer
				definition={definition}
				value={value}
				onChange={(next) => {
					if (typeof next === 'string') onChange(next)
				}}
			/>
		)
	}

	// 한 줄 제약(maxLines 1)의 자유 텍스트는 여러 줄 입력 UI가 성립하지 않는다 — 단일행 Input으로 렌더.
	if (input.format !== 'free' || input.maxLines === 1) {
		const isInvalidEmail =
			input.format === 'email' && value !== '' && !/^\S+@\S+\.\S+$/.test(value)

		return (
			<>
				<Controller.Row label={definition.label}>
					<Controller.Input
						type={input.format === 'free' ? 'text' : input.format}
						maxLength={definition.maxLength}
						placeholder={definition.placeholder ?? definition.label}
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
		<Controller.Field label={definition.label}>
			<Controller.Textarea
				maxLength={definition.maxLength}
				placeholder={definition.placeholder ?? definition.label}
				rows={2}
				value={value}
				onChange={(event) => {
					const next = event.target.value

					// 명시적 줄 수 제한 — 자동 줄바꿈 초과분은 렌더가 Figma 텍스트 박스 규칙대로 처리한다
					// (고정 박스는 overflow:hidden clip, 말줄임 설정은 -webkit-line-clamp 「…」).
					if (input.maxLines && next.split('\n').length > input.maxLines) {
						return
					}
					onChange(next)
				}}
			/>
		</Controller.Field>
	)
}
