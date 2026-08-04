'use client'

import { useSyncExternalStore } from 'react'

// 한 페이지의 layoutGridWidget들이 슬라이더 패널 하나를 공유하기 위한 모듈 스토어.
// 형제 위젯은 각자 독립 React 트리라 props·context로는 상태를 못 넘기지만, 같은 모듈을 import하므로
// 모듈 스코프는 공유된다. 그래서 컨트롤을 별도 위젯(layout-grid-controls)으로 떼어낼 수 있다.
//
// 🔴 규칙 범위(MARGIN_PCT·GUTTER_RATIO)는 정본이다. 슬라이더가 이 범위를 벗어날 수 없게 하는 게 규칙 인코딩이다.

/**
 * 마진 = 판형 **긴 축**의 3~6%. 짧은 축에도 같은 길이를 쓰므로 수직·수평 마진은 항상 같다.
 * 🔴 마진은 대지 → 표(9셀 전체)의 여백일 뿐이다. 개별 셀은 자기 마진을 갖지 않는다 —
 * 셀 사이를 벌리는 것은 거터뿐이고, 거터 0%면 셀 경계에서 콘텐츠가 맞닿는다.
 */
export const MARGIN_PCT = { min: 3, max: 6, default: 4.5 }

/** 거터 = 마진의 0~100%. 수직·수평 따로. 0%면 셀 사이 간격이 없다. */
export const GUTTER_RATIO = { min: 0, max: 100, default: 75 }

export type LayoutGridControls = {
	marginPct: number
	gutterX: number
	gutterY: number
	guidesOn: boolean
}

let state: LayoutGridControls = {
	marginPct: MARGIN_PCT.default,
	gutterX: GUTTER_RATIO.default,
	gutterY: GUTTER_RATIO.default,
	guidesOn: true,
}

const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
	listeners.add(listener)
	return () => {
		listeners.delete(listener)
	}
}

// 스냅샷은 변경 전까지 같은 참조라 useSyncExternalStore가 불필요하게 리렌더하지 않는다.
// 서버에서도 이 값이 쓰이지만 변경은 브라우저 이벤트에서만 일어나 요청 간 오염이 없다.
const getSnapshot = () => state

export function setLayoutGridControls(patch: Partial<LayoutGridControls>) {
	state = { ...state, ...patch }
	for (const listener of listeners) listener()
}

export function useLayoutGridControls() {
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
