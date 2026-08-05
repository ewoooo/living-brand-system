'use client'

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { GUTTER_RATIO, MARGIN_PCT } from './rules'

// 한 블록 안의 layoutGridWidget들이 값을 공유하는 스코프.
//
// 🔴 스코프는 **블록 단위**여야 한다. 모듈 스토어로 두면 섹션 라우트가 여러 Page를 한 화면에
//    렌더할 때 페이지마다 놓인 컨트롤 패널이 전부 같은 값을 물어, 한 패널을 움직이면 다른 페이지의
//    판형까지 따라 움직인다(2026-08-04 실제로 12개 판형이 함께 움직였다).
//    Block이 자식을 이 provider로 감싸므로 형제 위젯은 공통 조상을 통해 상태를 공유하고,
//    다른 블록끼리는 격리된다.

export type LayoutGridControls = {
	marginPct: number
	gutterX: number
	gutterY: number
	guidesOn: boolean
}

const DEFAULTS: LayoutGridControls = {
	marginPct: MARGIN_PCT.default,
	gutterX: GUTTER_RATIO.default,
	gutterY: GUTTER_RATIO.default,
	guidesOn: true,
}

type Scope = {
	/** 컨트롤 위젯이 admin에서 심은 값. 패널을 따르지 않는(lock) 판형이 이 값에 머문다. */
	initial: LayoutGridControls
	/** 슬라이더로 움직인 현재 값. */
	values: LayoutGridControls
	set: (patch: Partial<LayoutGridControls>) => void
	/** admin 초기값을 심는다 — 초기값과 현재값을 함께 세팅한다. */
	seed: (next: LayoutGridControls) => void
}

const LayoutGridContext = createContext<Scope | null>(null)

export function LayoutGridScope({ children }: { children: ReactNode }) {
	const [state, setState] = useState({ initial: DEFAULTS, values: DEFAULTS })
	// set·seed는 값이 바뀌어도 같은 참조여야 한다 — 소비자가 effect 의존에 넣을 수 있게.
	const set = useCallback(
		(patch: Partial<LayoutGridControls>) =>
			setState((prev) => ({ ...prev, values: { ...prev.values, ...patch } })),
		[],
	)
	const seed = useCallback(
		(next: LayoutGridControls) => setState({ initial: next, values: next }),
		[],
	)
	const scope = useMemo<Scope>(
		() => ({ initial: state.initial, values: state.values, set, seed }),
		[state, set, seed],
	)
	return <LayoutGridContext.Provider value={scope}>{children}</LayoutGridContext.Provider>
}

/** 스코프 밖(컨트롤 없이 판형만 둔 경우)이면 기본값을 읽기 전용으로 준다. */
const READ_ONLY: Scope = { initial: DEFAULTS, values: DEFAULTS, set: () => {}, seed: () => {} }

export function useLayoutGridScope(): Scope {
	return useContext(LayoutGridContext) ?? READ_ONLY
}
