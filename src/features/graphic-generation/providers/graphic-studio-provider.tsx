'use client'

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	GraphicStudioContext,
	type GraphicStudioValue,
} from '@/features/graphic-generation/contexts/graphic-studio-context'
import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import { getGraphicStudioRuntimeGroups } from '@/features/graphic-generation/runtime/graphic-studio-runtime'
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
	const [values, setValues] = useState(() => createControllerValues(initial.controller.groups))
	// 값이 좁히는 만큼 줄인 그룹 — 좁힐 것이 없으면 런타임이 같은 배열을 그대로 돌려준다.
	const groups = useMemo(() => getGraphicStudioRuntimeGroups(config, values), [config, values])
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

	/**
	 * 선택지가 좁아지면 들고 있던 값이 목록 밖에 남는다 — 화면은 그 값을 못 찾아 「—」를 그리고,
	 * 창작자는 무엇이 골라져 있는지 알 수 없다. 좁아진 계약의 기본값으로 끌어온다.
	 *
	 * 🔴 렌더 중에 고치지 않는다. 값을 바꾸면 groups가 다시 파생되는데, 그때는 이미 유효하므로
	 *    같은 객체가 돌아와 여기서 멈춘다(무한 루프가 아니다).
	 */
	useEffect(() => {
		setValues((current) => {
			let next = current
			for (const group of groups) {
				for (const control of group.controls) {
					if (!(control.id in current)) continue
					const value = current[control.id]
					if (
						value === undefined ||
						acceptsControllerDraftValue(control, value, bindingsRef.current[control.id])
					) {
						continue
					}
					if (next === current) next = { ...current }
					next[control.id] = control.defaultValue
				}
			}
			return next
		})
	}, [groups])

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
			const next = browse.data?.find((item) => item.id === nextProfileId)
			if (!next || next.id === config.id) return
			bindingsRef.current = {}
			setBindings({})
			setValues(createControllerValues(next.controller.groups))
			setConfig(next)
		},
		[browse.data, config.id],
	)
	const contextValue = useMemo<GraphicStudioValue>(
		() => ({
			profiles: { browse, select: selectProfile },
			config,
			groups,
			controls: { values, bindings, update, registerBindings },
		}),
		[bindings, browse, config, groups, registerBindings, selectProfile, update, values],
	)

	return (
		<GraphicStudioContext.Provider value={contextValue}>
			{children}
		</GraphicStudioContext.Provider>
	)
}
