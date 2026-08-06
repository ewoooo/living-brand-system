'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { TemplateSlotSpec } from '@/types/template'

/** 제작자가 요소에 설정한 입력 제약(형식·글자수·줄수)을 적용한 텍스트 슬롯 입력. */
export function TextSlotInput({
	id,
	spec,
	value,
	onChange,
}: {
	id: string
	spec: TemplateSlotSpec
	value: string
	onChange: (text: string) => void
}) {
	const format = spec.inputFormat ?? 'free'

	if (format !== 'free') {
		const isInvalidEmail = format === 'email' && value !== '' && !/^\S+@\S+\.\S+$/.test(value)

		return (
			<>
				<Input
					id={id}
					type={format}
					maxLength={spec.maxLength}
					placeholder={spec.placeholder ?? spec.label}
					value={value}
					onChange={(event) => onChange(event.target.value)}
				/>
				{isInvalidEmail && (
					<p className="font-body text-sm font-normal text-destructive">
						이메일 형식이 아닙니다.
					</p>
				)}
			</>
		)
	}

	return (
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
		/>
	)
}
