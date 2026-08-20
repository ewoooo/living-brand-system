'use client'

import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import { Controller } from '@/components/shared/controller'

/**
 * 카메라 허용 구간(방위·고도)을 JSON string[]로 저장하는 Admin 필드다.
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
	const selected = Array.isArray(value)
		? options.map(({ value: v }) => v).filter((v) => value.includes(v))
		: options.map(({ value: v }) => v)

	return (
		<fieldset className="lbs-kit field-type json mb-5">
			<FieldLabel label={label} path={path} />
			<FieldError message={errorMessage} path={path} showError={showError} />
			<Controller.Chips
				aria-label={label ?? '카메라 허용 구간'}
				disabled={disabled}
				options={options}
				value={selected}
				onChange={(next) => {
					const allowed = options
						.map(({ value: v }) => v)
						.filter((candidate) => next.includes(candidate))
					setValue(allowed.length === options.length ? undefined : allowed)
				}}
			/>
			<FieldDescription description={description} path={path} />
		</fieldset>
	)
}
