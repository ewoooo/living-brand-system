'use client'

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import type {
	ControllerControlValue,
	ControllerGroupDefinition,
	ControllerValues,
	StudioControllerRestrictions,
} from '@/modules/studio-controller/controller-definition'
import {
	applyControllerRestrictions,
	createControllerValues,
} from '@/modules/studio-controller/controller-definition'
import type { GuidelineControllerManifest } from './contract'

/**
 * 한 블록의 컨트롤 값 스코프.
 *
 * 🔴 스코프는 **블록 단위**여야 한다. 모듈 스토어로 두면 섹션 라우트가 여러 Page를 한 화면에
 *    렌더할 때 페이지마다 놓인 컨트롤이 전부 같은 값을 물어, 하나를 움직이면 다른 페이지의
 *    판형까지 따라 움직인다(2026-08-04에 실제로 12개가 함께 움직였다).
 *
 * 🔑 provider는 **매니페스트가 무엇을 뜻하는지 모른다.** `marginPct`가 마진인지 모르고, id로
 *    값을 넣고 뺄 뿐이다. 뜻은 매니페스트를 쓴 위젯이 갖는다.
 */

type GuidelineControllerScopeValue = {
	/** admin 제한까지 적용된 실효 그룹. 렌더러가 이것만 본다. */
	groups: readonly ControllerGroupDefinition[]
	/** 지금 값. 조작하면 여기가 바뀐다. */
	values: ControllerValues
	set: (controlId: string, value: ControllerControlValue) => void
}

const GuidelineControllerContext = createContext<GuidelineControllerScopeValue | null>(null)

export function GuidelineControllerScope({
	manifest,
	restrictions,
	children,
}: {
	manifest: GuidelineControllerManifest
	/** admin이 **좁히기만** 하는 값. 넓히면 `applyControllerRestrictions`가 던진다. */
	restrictions?: StudioControllerRestrictions | null
	children: ReactNode
}) {
	const groups = useMemo(
		() => applyControllerRestrictions(manifest.groups, restrictions ?? null),
		[manifest, restrictions],
	)
	// 🔑 값은 **실효 그룹 전체**에서 만든다. 알약에 안 실리는(readonly) 컨트롤도 값은 있어야
	//    판형이 admin이 고정한 값으로 그려진다.
	const [values, setValues] = useState<ControllerValues>(() => createControllerValues(groups))

	// set은 값이 바뀌어도 같은 참조여야 한다 — 소비자가 effect 의존에 넣을 수 있게.
	const set = useCallback(
		(controlId: string, value: ControllerControlValue) =>
			setValues((prev) => ({ ...prev, [controlId]: value })),
		[],
	)

	const scope = useMemo<GuidelineControllerScopeValue>(
		() => ({ groups, values, set }),
		[groups, values, set],
	)

	return (
		<GuidelineControllerContext.Provider value={scope}>
			{children}
		</GuidelineControllerContext.Provider>
	)
}

const EMPTY: GuidelineControllerScopeValue = { groups: [], values: {}, set: () => {} }

/** 스코프 밖(컨트롤 없이 그림만 둔 경우)이면 빈 값을 읽기 전용으로 준다. */
export function useGuidelineController(): GuidelineControllerScopeValue {
	return useContext(GuidelineControllerContext) ?? EMPTY
}

/**
 * 매니페스트의 기본값을 타입 좁히기와 함께 읽는다 — 스코프 밖이거나 admin이 컨트롤을 지웠을 때
 * 위젯이 `undefined`로 그려지지 않게 한다.
 *
 * ponytail: 위젯이 controlId 문자열로 값을 집는다. 매니페스트와 위젯이 id로 묶이는 것이 지금의
 * 천장이고, 올릴 길은 매니페스트가 위젯이 읽을 타입까지 함께 발행하는 것이다(2026-08-18 보류).
 */
export function controllerNumber(values: ControllerValues, id: string, fallback: number): number {
	const value = values[id]
	return typeof value === 'number' ? value : fallback
}

export function controllerBoolean(
	values: ControllerValues,
	id: string,
	fallback: boolean,
): boolean {
	const value = values[id]
	return typeof value === 'boolean' ? value : fallback
}
