'use client'

import { useEffect, useState } from 'react'
import { CI_LOCKUP_CONTROLS } from '../ci-lockup/manifest'
import { reducedMotion } from '../ci-lockup/motion'
import { branchLabel, OVERSEAS_BRANCHES, SUBSIDIARIES } from '../ci-lockup/rules'
import { CiLockupView } from '../ci-lockup/view'

/**
 * 이름 한 자리만 갈아 끼우는 히어로.
 *
 * 🔑 락업은 `CiLockupView`가 그대로 그린다 — 축을 **전부 고정해서** 넘기면 알약과 무관하게
 *    자기 값으로만 그려지고(`view.tsx`의 `pick`), 이 위젯이 조판·색·간격을 다시 정의하지 않는다.
 * 🔑 이름이 바뀌면 락업 폭이 바뀌는데, 그 이동은 `LockupFigure`의 FLIP이 이미 이어 준다
 *    (의존 목록이 없어 「무엇이 바뀌었는지」를 몰라도 잡힌다). 그래서 여기 애니메이션 코드가 없다.
 * 🔴 `prefers-reduced-motion`이면 돌리지 않는다 — 끝나지 않는 자동 변화는 그 설정이 막으려는 것 자체다.
 *    ponytail: 멈춤 버튼은 두지 않았다. 필요해지면 축 하나(`paused`)와 버튼 하나다.
 */

/** 이름이 바뀌는 간격(ms). ponytail: 상수 하나 — 조율이 필요해지면 admin 필드로 올린다. */
const CYCLE_MS = 2200

/** 🔑 축 목록은 매니페스트에서 파생한다 — 축이 늘면 여기 고정 목록이 저절로 따라온다. */
const ALL_AXES = CI_LOCKUP_CONTROLS.map((control) => control.id)

/** 해외지사 히어로가 계열사 자리에 세우는 일반명사. 목록 맨 끝의 자리표시 항목이다. */
const PLACEHOLDER_SUBSIDIARY = SUBSIDIARIES[SUBSIDIARIES.length - 1]

export type CiLockupHeroSource = 'subsidiary' | 'branch'

export function CiLockupHeroView({
	colors,
	source,
	h,
}: {
	colors: Record<string, string>
	source: CiLockupHeroSource
	h: number
}) {
	const overseas = source === 'branch'
	// 자회사는 국문 이름, 해외지사는 영문 지역명이 돈다(정본 도판이 그렇게 갈라져 있다).
	const names = overseas ? OVERSEAS_BRANCHES.map(branchLabel) : SUBSIDIARIES.map((sub) => sub.ko)
	const [index, setIndex] = useState(0)

	useEffect(() => {
		if (reducedMotion()) return
		const timer = setInterval(() => setIndex((n) => (n + 1) % names.length), CYCLE_MS)
		return () => clearInterval(timer)
	}, [names.length])

	const name = names[index % names.length]

	return (
		<CiLockupView
			colors={colors}
			fixed={{
				hiddenControls: ALL_AXES,
				h,
				// 🔴 해외지사 락업도 자회사명을 함께 쓴다(`rules.ts`의 `overseasLockups`) — 켜 둔다.
				//    🔑 그 자리에는 **자리표시 계열사**를 세운다(사용자 지정 2026-08-21) — 도는 것은
				//    지역명이고, 계열사 자리에 실존 이름을 세우면 그 조합이 승인된 것처럼 읽힌다.
				subsidiaryOn: true,
				subsidiary: overseas ? PLACEHOLDER_SUBSIDIARY.ko : name,
				branchOn: overseas,
				branch: overseas ? name : branchLabel(OVERSEAS_BRANCHES[0]),
				// 국문 가로형A만 `HD`와 회사명이 한 줄로 붙는다 — 히어로가 필요한 것이 그 한 줄이다.
				form: 'horizontalA',
				language: overseas ? 'en' : 'ko',
				colorType: 'fullColor',
				mono: 'BLACK',
				clearSpace: 'off',
				measured: false,
			}}
		/>
	)
}

export default CiLockupHeroView
