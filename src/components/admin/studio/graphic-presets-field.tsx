'use client'

import { FieldDescription, FieldError, useField, useFormFields } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
import { type ComponentProps, useState } from 'react'
import { AdminSectionHeading } from '@/components/admin/shared/admin-section-heading'
import { Controller } from '@/components/shared/controller'
import { ControllerRenderer } from '@/components/shared/controller-renderer'
import {
	type ArtboardKey,
	listArtboardOptions,
	presetSizeInPx,
} from '@/components/studio/shared/output-controls'
import { Button } from '@/components/ui/button'
import type { GraphicRuntimeManifest } from '@/features/graphic-generation/domain/graphic-studio-config'
import {
	applyControllerRestrictions,
	type ControllerControlValue,
	type ControllerValues,
	createControllerValues,
	projectPayloadControllerRestrictions,
} from '@/modules/studio-controller/controller-definition'
import { GraphicPresetPreview } from './graphic-preset-preview'
import {
	type StudioAdminBaseConfig,
	type StudioAdminRuntimeSource,
	useStudioRuntimeManifest,
} from './use-studio-runtime-manifest'

type StoredPreset = { presetId?: string; label?: string; values?: unknown; id?: string }

/** 미리보기 판의 초기 비율. Admin이 바꿀 수 있고 프리셋에는 저장되지 않는다. */
const DEFAULT_ARTBOARD: ArtboardKey = 'wide'

/**
 * 매니저가 창작자에게 **제공할 프리셋**을 만드는 화면.
 *
 * 🔑 왜 Admin에 있나 — 같은 사람이 같은 화면에서 「무엇을 노출할지」(`controllerRestrictions`)와
 *    「어디서 시작할지」(프리셋)를 정한다. 둘 다 매니저가 창작자에게 제공하는 것이라 한자리에 있다.
 * 🔑 그래서 컨트롤 목록은 runtime 원본이 아니라 **이 폼에서 방금 좁힌 것**을 쓴다. 저장 전 값을
 *    읽으므로 제한을 바꾸면 프리셋 화면이 즉시 따라온다.
 * 🔴 판 크기는 프리셋에 저장하지 않는다 — 그것은 창작자가 고르는 값이고, 여기 판은 만들 때 보는 눈이다.
 */
export function GraphicPresetsField({
	path,
	source,
	baseConfigs = [],
}: ComponentProps<JSONFieldClientComponent> & {
	source: StudioAdminRuntimeSource
	baseConfigs?: readonly StudioAdminBaseConfig[]
}) {
	const { disabled, errorMessage, setValue, showError, value } = useField<unknown>({ path })
	const manifest = useStudioRuntimeManifest(source, baseConfigs)
	const restrictions = useFormFields(([fields]) => fields.controllerRestrictions?.value)
	const [artboard, setArtboard] = useState<ArtboardKey>(DEFAULT_ARTBOARD)
	const [selected, setSelected] = useState(0)

	const presets = readPresets(value)
	const groups = resolveGroups(manifest, restrictions)
	const current = presets[selected]
	const values = withDefaults(groups, current?.values)
	const size = presetSizeInPx(artboard)

	function replace(next: readonly StoredPreset[]) {
		setValue(next)
	}

	function updateCurrent(patch: Partial<StoredPreset>) {
		if (!current) return
		replace(
			presets.map((preset, index) => (index === selected ? { ...preset, ...patch } : preset)),
		)
	}

	function add() {
		const next = [
			...presets,
			{ presetId: nextPresetId(presets), label: `프리셋 ${presets.length + 1}`, values: {} },
		]
		replace(next)
		setSelected(next.length - 1)
	}

	function remove() {
		if (!current) return
		replace(presets.filter((_, index) => index !== selected))
		setSelected((index) => Math.max(0, index - 1))
	}

	return (
		<div className="lbs-kit field-type json mb-20">
			<AdminSectionHeading>제공 프리셋</AdminSectionHeading>
			<FieldError message={errorMessage} path={path} showError={showError} />
			<div className="flex flex-col gap-3 rounded-3xl border bg-background px-3 pt-6 pb-3">
				{groups.length === 0 ? (
					<p className="px-1 pb-3 text-sm text-muted-foreground">
						Runtime을 먼저 고르면 그 Controller로 프리셋을 만들 수 있습니다.
					</p>
				) : (
					<>
						<Controller.Row label="프리셋">
							<Controller.Select
								options={presets.map((preset, index) => ({
									value: String(index),
									label: preset.label || preset.presetId || `프리셋 ${index + 1}`,
								}))}
								value={
									presets.length > 0
										? String(Math.min(selected, presets.length - 1))
										: undefined
								}
								onChange={(next) => setSelected(Number(next))}
								disabled={presets.length === 0}
							/>
						</Controller.Row>
						<div className="flex gap-2 px-1">
							<Button type="button" size="sm" onClick={add} disabled={disabled}>
								프리셋 추가
							</Button>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={remove}
								disabled={disabled || !current}
							>
								선택한 프리셋 삭제
							</Button>
						</div>
						{current && (
							<>
								<Controller.Row label="식별자">
									<Controller.Input
										defaultValue={current.presetId ?? ''}
										key={`id-${selected}`}
										onBlur={(event) =>
											updateCurrent({
												presetId: event.currentTarget.value.trim(),
											})
										}
									/>
								</Controller.Row>
								<Controller.Row label="이름">
									<Controller.Input
										defaultValue={current.label ?? ''}
										key={`label-${selected}`}
										onBlur={(event) =>
											updateCurrent({ label: event.currentTarget.value })
										}
									/>
								</Controller.Row>
								{/* 🔴 이 판은 저장되지 않는다 — 창작자가 쓸 판을 보면서 맞추라고 두는 눈이다. */}
								<Controller.Row label="미리보기 판">
									<Controller.Select
										options={listArtboardOptions({ current: artboard })}
										value={artboard}
										onChange={(next) => setArtboard(next as ArtboardKey)}
									/>
								</Controller.Row>
								{manifest && (
									<GraphicPresetPreview
										manifest={manifest as GraphicRuntimeManifest}
										values={values}
										aspectRatio={size.width / size.height}
									/>
								)}
								<ControllerRenderer
									groups={groups}
									values={values}
									onChange={(controlId, next) =>
										updateCurrent({
											values: {
												...(values as Record<
													string,
													ControllerControlValue
												>),
												[controlId]: next,
											},
										})
									}
								/>
							</>
						)}
					</>
				)}
			</div>
			<FieldDescription
				description="창작자는 이 중 하나를 골라 시작한 뒤 노출된 컨트롤을 조정합니다 — 하나라도 만지면 프리셋 선택이 풀립니다. 어떤 컨트롤을 노출할지는 위의 「Controller 제한」이 정하고, 프리셋은 그 범위 안의 값 조합입니다."
				path={path}
			/>
		</div>
	)
}

function readPresets(value: unknown): readonly StoredPreset[] {
	return Array.isArray(value) ? (value as StoredPreset[]) : []
}

/** 저장된 값이 비어 있어도 컨트롤이 기본값으로 그려지도록 채운다. */
function withDefaults(groups: ReturnType<typeof resolveGroups>, stored: unknown): ControllerValues {
	const defaults = createControllerValues(groups)
	if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return defaults
	const values: ControllerValues = { ...defaults }
	for (const [key, entry] of Object.entries(stored as Record<string, ControllerControlValue>)) {
		if (key in defaults) values[key] = entry
	}
	return values
}

/** 🔑 runtime 원본이 아니라 이 폼이 방금 좁힌 컨트롤을 쓴다. */
function resolveGroups(
	manifest: ReturnType<typeof useStudioRuntimeManifest>,
	restrictions: unknown,
) {
	if (!manifest) return []
	return applyControllerRestrictions(
		manifest.controller.groups,
		projectPayloadControllerRestrictions(restrictions),
	)
}

/** 겹치지 않는 식별자를 만든다 — 중복은 저장 시 validate가 막지만 기본값부터 안 겹치게 둔다. */
function nextPresetId(presets: readonly StoredPreset[]): string {
	const used = new Set(presets.map((preset) => preset.presetId))
	let index = presets.length + 1
	while (used.has(`preset-${index}`)) index += 1
	return `preset-${index}`
}
