'use client'

import { useSyncExternalStore } from 'react'
import { GUTTER_RATIO, MARGIN_PCT } from './rules'

// 한 페이지의 layoutGridWidget들이 값 하나를 공유하기 위한 모듈 스토어.
// 형제 위젯은 각자 독립 React 트리라 props·context로는 상태를 못 넘기지만, 같은 모듈을 import하므로
// 모듈 스코프는 공유된다. 그래서 컨트롤을 별도 위젯(layout-grid-controls)으로 떼어낼 수 있다.
//
// 🔴 여기 값은 "현재 값"일 뿐이고, 무엇을 조절할 수 있는지는 컨트롤 위젯이 결정한다.
//    조절 불허 = 슬라이더를 그리지 않는 것이고, 그러면 admin이 넣은 값이 그대로 고정값이 된다.
// 🔴 마진은 대지 → 표(9셀 전체)의 여백일 뿐이다. 셀 사이를 벌리는 것은 거터뿐이다.

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
