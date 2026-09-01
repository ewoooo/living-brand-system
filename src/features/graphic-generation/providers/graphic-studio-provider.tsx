'use client'

import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import {
	GraphicStudioContext,
	type GraphicStudioValue,
} from '@/features/graphic-generation/contexts/graphic-studio-context'
import {
	findGraphicProfilePreset,
	pickGraphicPresetValues,
} from '@/features/graphic-generation/domain/graphic-preset'
import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import { fetchGraphicStudioConfigs } from '@/features/graphic-generation/services/list-graphic-studio-configs.client'
import { useLazyResource } from '@/hooks/use-lazy-resource'
import {
	acceptsControllerDraftValue,
	type ControllerControlValue,
	type ControllerRuntimeBinding,
	type ControllerRuntimeBindings,
	createControllerValues,
} from '@/modules/studio-controller/controller-definition'

/**
 * 가변 그래픽 편집 세션의 단일 소유자 — Controller와 P5·Shader 캔버스는 이 컨텍스트만
 * 알고 서로를 모른다. Definition은 기본값·제약을, Provider는 현재 값과 출력 액션을 소유한다.
 */
export function GraphicStudioProvider({
	config: initial,
	children,
}: {
	config: GraphicStudioConfig
	children: ReactNode
}) {
	// 교체 후보 전체는 자산 브라우저가 열릴 때 가져온다 — 페이지는 시작 계약 하나만 싣는다.
	const browse = useLazyResource(fetchGraphicStudioConfigs)
	const [config, setConfig] = useState(initial)
	const groups = config.controller.groups
	const [values, setValues] = useState(() => createControllerValues(initial.controller.groups))
	const [bindings, setBindings] = useState<ControllerRuntimeBindings>({})
	// 🔑 프리셋 선택은 값이 아니라 화면 상태다 — 컨트롤을 하나라도 만지면 풀리고,
	//    값을 손으로 되돌려도 다시 붙지 않는다(같은 값 ≠ 같은 선택).
	const [preset, setPreset] = useState<string | null>(null)
	const bindingsRef = useRef<ControllerRuntimeBindings>({})
	const definitions = useMemo(
		() =>
			new Map(
				groups.flatMap((group) =>
					group.controls.map((control) => [control.id, control] as const),
				),
			),
		[groups],
	)

	const update = useCallback(
		(controlId: string, value: ControllerControlValue) => {
			const definition = definitions.get(controlId)
			if (
				!definition ||
				!acceptsControllerDraftValue(definition, value, bindingsRef.current[controlId])
			) {
				return false
			}
			setValues((current) => ({ ...current, [controlId]: value }))
			setPreset(null)
			return true
		},
		[definitions],
	)

	const registerBindings = useCallback(
		(runtimeBindings: ControllerRuntimeBindings) => {
			const next: Record<string, ControllerRuntimeBinding> = {}
			for (const [controlId, binding] of Object.entries(runtimeBindings)) {
				if (definitions.has(controlId)) next[controlId] = binding
			}
			bindingsRef.current = next
			setBindings(next)
		},
		[definitions],
	)

	const applyPreset = useCallback(
		(presetId: string) => {
			const found = findGraphicProfilePreset(config.presets ?? [], presetId)
			if (!found) return
			setValues((current) => ({
				...current,
				...pickGraphicPresetValues(config.controller.groups, found),
			}))
			setPreset(presetId)
		},
		[config.controller.groups, config.presets],
	)

	const selectProfile = useCallback(
		(nextProfileId: string) => {
			const next = browse.data?.find((item) => item.id === nextProfileId)
			if (!next || next.id === config.id) return
			bindingsRef.current = {}
			setBindings({})
			setValues(createControllerValues(next.controller.groups))
			setPreset(null)
			setConfig(next)
		},
		[browse.data, config.id],
	)
	const contextValue = useMemo<GraphicStudioValue>(
		() => ({
			profiles: { browse, select: selectProfile },
			config,
			controls: { values, bindings, update, registerBindings },
			preset: { applied: preset, apply: applyPreset },
		}),
		[
			applyPreset,
			bindings,
			browse,
			config,
			preset,
			registerBindings,
			selectProfile,
			update,
			values,
		],
	)

	return (
		<GraphicStudioContext.Provider value={contextValue}>
			{children}
		</GraphicStudioContext.Provider>
	)
}
