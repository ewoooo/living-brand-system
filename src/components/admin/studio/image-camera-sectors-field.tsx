'use client'

import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'

/**
 * 카메라 허용 구간(방위·고도)을 JSON string[]로 저장하는 Admin 체크박스 필드다.
 * 구간 목록은 런타임 매니페스트가 소유하므로 여기서는 clientProps로 받은 것만 그린다.
 * 전부 선택하면 값을 비운다 — "비우면 전부 허용"이 계약의 기본값이라 같은 상태를 두 번 적지 않는다.
 */
export function ImageCameraSectorsField({
	description,
	label,
	options,
	path,
}: {
	description?: string
	label?: string
	options: readonly { label: string; value: string }[]
	path: string
}) {
	const { disabled, errorMessage, setValue, showError, value } = useField<
		readonly string[] | null | undefined
	>({ path })
	const selected = new Set(Array.isArray(value) ? value : options.map((option) => option.value))

	return (
		<fieldset className="field-type json mb-5">
			<FieldLabel label={label} path={path} />
			<FieldError message={errorMessage} path={path} showError={showError} />
			<div className="flex flex-wrap gap-3">
				{options.map((option) => (
					<label key={option.value} className="flex items-center gap-1.5 text-sm">
						<input
							type="checkbox"
							checked={selected.has(option.value)}
							disabled={disabled}
							onChange={() => {
								const next = options
									.map(({ value }) => value)
									.filter((candidate) =>
										candidate === option.value
											? !selected.has(candidate)
											: selected.has(candidate),
									)
								setValue(next.length === options.length ? undefined : next)
							}}
						/>
						{option.label}
					</label>
				))}
			</div>
			<FieldDescription description={description} path={path} />
		</fieldset>
	)
}
