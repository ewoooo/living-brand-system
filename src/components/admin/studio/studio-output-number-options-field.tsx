'use client'

import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { resolveStudioOutputCapability } from '@/features/studio-export/studio-output'
import {
	type StudioAdminBaseConfig,
	type StudioAdminRuntimeSource,
	useStudioRuntimeManifest,
} from './use-studio-runtime-manifest'

/**
 * 공통 output 숫자 제한(PPI/FPS)의 Admin 필드 — 정본(76:4)의 '사용할 ○○' 다중 토글.
 * JSON number[] 허용 목록으로 저장하고, 전부 켜면 undefined(제한 없음)로 접는다.
 */
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
	const numbers = visibleOptions.map(({ value }) => Number(value))
	const selected = Array.isArray(value) ? value.filter((v) => numbers.includes(v)) : numbers

	return (
		<fieldset className="field-type json mb-5">
			<FieldLabel label={label} path={path} />
			<FieldError message={errorMessage} path={path} showError={showError} />
			{numbers.length > 0 && (
				<ToggleGroup
					type="multiple"
					variant="outline"
					size="sm"
					aria-label={label}
					disabled={disabled}
					value={selected.map(String)}
					onValueChange={(next) => {
						const allowed = numbers.filter((candidate) =>
							next.includes(String(candidate)),
						)
						setValue(allowed.length === numbers.length ? undefined : allowed)
					}}
				>
					{visibleOptions.map((option) => (
						<ToggleGroupItem key={option.value} value={String(Number(option.value))}>
							{option.label}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			)}
			<FieldDescription description={description} path={path} />
		</fieldset>
	)
}
