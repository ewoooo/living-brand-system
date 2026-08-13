'use client'

import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import { resolveStudioOutputCapability } from '@/features/studio-export/studio-output'
import {
	type StudioAdminBaseConfig,
	type StudioAdminRuntimeSource,
	useStudioRuntimeManifest,
} from './use-studio-runtime-manifest'

/** 공통 output 숫자 제한(PPI/FPS)을 JSON number[]로 저장하는 Admin 체크박스 필드다. */
export function StudioOutputNumberOptionsField({
	description,
	baseConfigs = [],
	kind,
	label,
	options,
	path,
	source,
}: {
	baseConfigs?: readonly StudioAdminBaseConfig[]
	description?: string
	kind: 'print' | 'video'
	label?: string
	options: readonly { label: string; value: number | string }[]
	path: string
	source: StudioAdminRuntimeSource
}) {
	const { disabled, errorMessage, setValue, showError, value } = useField<
		readonly number[] | null | undefined
	>({ path })
	const manifest = useStudioRuntimeManifest(source, baseConfigs)
	const output = manifest ? resolveStudioOutputCapability(manifest.artifacts) : null
	const supported: readonly number[] | undefined =
		kind === 'print' ? output?.print?.ppi : output?.video?.mp4.fps
	const visibleOptions = options.filter(({ value }) => supported?.includes(Number(value)))
	const selected = new Set(
		Array.isArray(value) ? value : visibleOptions.map(({ value }) => Number(value)),
	)

	return (
		<fieldset className="field-type json mb-5">
			<FieldLabel label={label} path={path} />
			<FieldError message={errorMessage} path={path} showError={showError} />
			<div className="flex flex-wrap gap-3">
				{visibleOptions.map((option) => {
					const number = Number(option.value)
					return (
						<label key={number} className="flex items-center gap-1.5 text-sm">
							<input
								type="checkbox"
								checked={selected.has(number)}
								disabled={disabled}
								onChange={() => {
									const next = visibleOptions
										.map(({ value }) => Number(value))
										.filter((candidate) =>
											candidate === number
												? !selected.has(candidate)
												: selected.has(candidate),
										)
									setValue(
										next.length === visibleOptions.length ? undefined : next,
									)
								}}
							/>
							{option.label}
						</label>
					)
				})}
			</div>
			<FieldDescription description={description} path={path} />
		</fieldset>
	)
}
