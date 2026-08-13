'use client'

import { FieldDescription, FieldError, FieldLabel, useField, useFormFields } from '@payloadcms/ui'
import type { SelectFieldClientComponent } from 'payload'
import type { ComponentProps } from 'react'
import { useEffect } from 'react'
import {
	STUDIO_OUTPUT_FORMAT_OPTIONS,
	type StudioOutputFormat,
} from '@/features/studio-export/export-contract'
import { resolveStudioArtifactOutputFormats } from '@/features/studio-export/studio-output'
import {
	type StudioAdminBaseConfig,
	type StudioAdminRuntimeSource,
	useStudioRuntimeManifest,
} from './use-studio-runtime-manifest'

type StudioOutputFormatsFieldProps = ComponentProps<SelectFieldClientComponent> & {
	source: StudioAdminRuntimeSource
	baseConfigs?: readonly StudioAdminBaseConfig[]
}

/** 선택한 Runtime Artifact를 실제 Exporter가 만들 수 있는 형식만 Admin에 보여준다. */
export function StudioOutputFormatsField({
	path,
	source,
	baseConfigs = [],
}: StudioOutputFormatsFieldProps) {
	const { disabled, errorMessage, setValue, showError, value } = useField<
		readonly StudioOutputFormat[] | null | undefined
	>({ path })
	const manifest = useStudioRuntimeManifest(source, baseConfigs)
	const printPpi = useFormFields(([fields]) => fields.printPpi?.value)
	const formats = manifest
		? resolveStudioArtifactOutputFormats(
				manifest.artifacts,
				undefined,
				source === 'template' && printPpi ? ['print'] : [],
			)
		: []
	const restricted = Array.isArray(value)
	const selected = new Set(restricted ? value : formats)

	useEffect(() => {
		if (!restricted) return
		const supported = new Set(formats)
		const next = value.filter((format) => supported.has(format))
		if (next.length !== value.length) setValue(next)
	}, [formats, restricted, setValue, value])

	return (
		<fieldset className="field-type select mb-5">
			<FieldLabel label="허용 형식" path={path} />
			<FieldError message={errorMessage} path={path} showError={showError} />
			{formats.length === 0 ? (
				<p className="text-sm text-muted-foreground">Runtime을 먼저 선택해 주세요.</p>
			) : (
				<div className="flex flex-wrap gap-3">
					{STUDIO_OUTPUT_FORMAT_OPTIONS.filter(({ value: format }) =>
						formats.includes(format),
					).map(({ label, value: format }) => (
						<label key={format} className="flex items-center gap-1.5 text-sm">
							<input
								type="checkbox"
								checked={selected.has(format)}
								disabled={disabled}
								onChange={() => {
									const next = formats.filter((candidate) =>
										candidate === format
											? !selected.has(candidate)
											: selected.has(candidate),
									)
									setValue(next.length === formats.length ? undefined : next)
								}}
							/>
							{label}
						</label>
					))}
				</div>
			)}
			<FieldDescription
				description="선택한 Runtime Artifact와 Exporter가 지원하는 형식만 표시합니다. 모두 선택하면 별도 제한을 저장하지 않습니다."
				path={path}
			/>
		</fieldset>
	)
}
