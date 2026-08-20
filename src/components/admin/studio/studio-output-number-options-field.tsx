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
 * 공통 output 숫자 제한(PPI/FPS)의 Admin 필드 — 정본(76:4)대로 '최대'를 하나 고른다.
 * 저장은 기존 계약(JSON number[] 허용 목록) 그대로: 고른 최대 이하의 옵션 전부를 담고,
 * 최고값이면 undefined(제한 없음)로 접는다. 기존 저장값은 목록의 최고값을 최대로 읽는다.
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
	const stored = Array.isArray(value)
		? value.filter((candidate) => numbers.includes(candidate))
		: numbers
	const max = stored.length ? Math.max(...stored) : Math.max(...numbers)

	return (
		<fieldset className="field-type json mb-5">
			<FieldLabel label={label} path={path} />
			<FieldError message={errorMessage} path={path} showError={showError} />
			{numbers.length > 0 && (
				<ToggleGroup
					type="single"
					variant="outline"
					size="sm"
					aria-label={label}
					disabled={disabled}
					value={String(max)}
					onValueChange={(next) => {
						if (!next) return
						const cap = Number(next)
						const allowed = numbers.filter((candidate) => candidate <= cap)
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
