'use client'

import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import type { SelectFieldClientComponent } from 'payload'
import type { ComponentProps } from 'react'
import { useEffect } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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

const OUTPUT_FORMAT_LABELS = new Map(
	STUDIO_OUTPUT_FORMAT_OPTIONS.map(({ label, value }) => [value, label]),
)

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
	const formats = manifest
		? resolveStudioArtifactOutputFormats(manifest.artifacts, undefined)
		: []
	const restricted = Array.isArray(value)
	const selected = new Set(restricted ? value : formats)
	const formatsKey = formats.join(',')

	useEffect(() => {
		if (!restricted) return
		const supported = new Set(formatsKey.split(','))
		const next = value.filter((format) => supported.has(format))
		if (next.length !== value.length) setValue(next)
	}, [formatsKey, restricted, setValue, value])

	return (
		<fieldset className="field-type select mb-5">
			<FieldLabel label="허용 형식" path={path} />
			<FieldError message={errorMessage} path={path} showError={showError} />
			{formats.length === 0 ? (
				<p className="text-sm text-muted-foreground">Runtime을 먼저 선택해 주세요.</p>
			) : (
				<ToggleGroup
					type="multiple"
					variant="outline"
					size="sm"
					aria-label="허용 형식"
					disabled={disabled}
					value={formats.filter((format) => selected.has(format))}
					onValueChange={(next) => {
						const allowed = formats.filter((format) => next.includes(format))
						setValue(allowed.length === formats.length ? undefined : allowed)
					}}
				>
					{formats.map((format) => (
						<ToggleGroupItem key={format} value={format}>
							{OUTPUT_FORMAT_LABELS.get(format)}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			)}
			<FieldDescription
				description="선택한 Runtime Artifact와 Exporter가 지원하는 형식만 표시합니다. 모두 선택하면 별도 제한을 저장하지 않습니다."
				path={path}
			/>
		</fieldset>
	)
}
