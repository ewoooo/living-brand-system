'use client'

import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import {
	GraphicStudioContext,
	type GraphicStudioValue,
} from '@/features/graphic-generation/contexts/graphic-studio-context'
import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
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
	configs,
	children,
}: {
	configs: readonly GraphicStudioConfig[]
	children: ReactNode
}) {
	const initial = configs[0]
	if (!initial) {
		throw new Error('GraphicStudioProvider는 계약이 최소 하나 있을 때만 사용할 수 있습니다.')
	}

	const [profileId, setProfileId] = useState(initial.id)
	const config = configs.find((item) => item.id === profileId) ?? initial
	const groups = config.controller.groups
	const [values, setValues] = useState(() => createControllerValues(initial.controller.groups))
	const [bindings, setBindings] = useState<ControllerRuntimeBindings>({})
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

	const selectProfile = useCallback(
		(nextProfileId: string) => {
			const next = configs.find((item) => item.id === nextProfileId)
			if (!next || next.id === profileId) return
			bindingsRef.current = {}
			setBindings({})
			setValues(createControllerValues(next.controller.groups))
			setProfileId(next.id)
		},
		[configs, profileId],
	)
	const contextValue = useMemo<GraphicStudioValue>(
		() => ({
			profiles: { options: configs, select: selectProfile },
			config,
			controls: { values, bindings, update, registerBindings },
		}),
		[bindings, config, configs, registerBindings, selectProfile, update, values],
	)

	return (
		<GraphicStudioContext.Provider value={contextValue}>
			{children}
		</GraphicStudioContext.Provider>
	)
}
