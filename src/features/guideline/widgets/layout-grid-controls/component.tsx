'use client'

import { Fragment, type ReactNode, useEffect } from 'react'
import { ControllerRange, ControllerRow, ControllerSegmented } from '@/components/shared/controller'
import { Separator } from '@/components/ui/separator'
import { GUTTER_RATIO, MARGIN_PCT } from '../layout-grid/rules'
import { useLayoutGridScope } from '../layout-grid/store'

// 위젯: 같은 **블록**의 layoutGridWidget들을 통제한다. 값은 블록 단위 스코프(layout-grid/store.tsx)에
// 있어 형제 위젯끼리 공유되고, 이 위젯이 유일한 쓰기 주체다. 다른 블록의 패널과는 간섭하지 않는다.
//
// 화면에서의 자리는 블록 헤더가 아니라 **하단 Floating Controller**다(components/globals/guideline-helper.tsx).
// 이 위젯은 자기 위치를 모른다 — 알약의 내용물만 그리고, 어디에 뜰지는 Helper가 정한다.
//
// 겉모습은 Controller 킷이 소유한다(docs/10 §3.6). Figma에서 이 알약의 부품 이름이
// `Value Range`·`Toggle`인데, 그것이 곧 킷의 `ControllerRange`·`ControllerSegmented`다 —
// 같은 Figma Controller API를 두 표면이 공유한다. 여기서 다시 만들지 않는다.
//
// 🔑 조절 허용 여부가 페이지별 템플릿을 만든다: 허용하면 컨트롤이 나오고 admin 값은 초기값이 되며,
//    허용하지 않으면 컨트롤이 없으므로 admin 값이 고정값이 된다.
// 🔴 값 범위는 정본 규칙(rules.ts)이다. 넓히면 규칙이 깨진다.

export type LayoutGridControlsConfig = {
	marginPct?: number | null
	marginAdjustable?: boolean | null
	gutterX?: number | null
	gutterXAdjustable?: boolean | null
	gutterY?: number | null
	gutterYAdjustable?: boolean | null
	guidesOn?: boolean | null
	guidesAdjustable?: boolean | null
}

/** Figma Value Range 폭(61:4673). 알약이 담기는 자리가 달라져도 조작감이 같아야 해서 고정이다. */
const RANGE_WIDTH = 'w-45'

const percent = (value: number) => `${value}%`

const GUIDE_OPTIONS = [
	{ value: 'on', label: '보임' },
	{ value: 'off', label: '숨김' },
] as const

export function LayoutGridControlsWidget(config: LayoutGridControlsConfig) {
	const {
		values: { marginPct, gutterX, gutterY, guidesOn },
		set,
		seed,
	} = useLayoutGridScope()

	const initialMargin = config.marginPct ?? MARGIN_PCT.default
	const initialGutterX = config.gutterX ?? GUTTER_RATIO.default
	const initialGutterY = config.gutterY ?? GUTTER_RATIO.default
	const initialGuides = config.guidesOn ?? true

	// admin 값을 스토어에 심는다. 조절 불허인 값은 여기서 들어간 뒤 바뀌지 않아 고정값이 된다.
	// 판형들이 이 위젯보다 먼저 렌더되므로 첫 프레임은 기본값으로 그려지고 곧바로 이 값으로 정착한다.
	useEffect(() => {
		seed({
			marginPct: initialMargin,
			gutterX: initialGutterX,
			gutterY: initialGutterY,
			guidesOn: initialGuides,
		})
	}, [seed, initialMargin, initialGutterX, initialGutterY, initialGuides])

	const showMargin = config.marginAdjustable ?? true
	const showGutterX = config.gutterXAdjustable ?? true
	const showGutterY = config.gutterYAdjustable ?? true
	const showGuides = config.guidesAdjustable ?? true

	// 구분선은 **성격이 바뀌는 자리**에만 온다(Figma 61:4672): 마진 ┃ 거터들 ┃ 표시 전환.
	// 거터 둘은 같은 성격이라 사이에 선이 없다.
	const groups: ReactNode[][] = [
		[
			showMargin ? (
				<ControllerRange
					key="margin"
					label="마진"
					value={marginPct}
					min={MARGIN_PCT.min}
					max={MARGIN_PCT.max}
					step={0.1}
					format={percent}
					onChange={(marginPct) => set({ marginPct })}
					className={RANGE_WIDTH}
				/>
			) : null,
		],
		[
			showGutterX ? (
				<ControllerRange
					key="gutter-x"
					label="수평 거터"
					value={gutterX}
					min={GUTTER_RATIO.min}
					max={GUTTER_RATIO.max}
					step={1}
					format={percent}
					onChange={(gutterX) => set({ gutterX })}
					className={RANGE_WIDTH}
				/>
			) : null,
			showGutterY ? (
				<ControllerRange
					key="gutter-y"
					label="수직 거터"
					value={gutterY}
					min={GUTTER_RATIO.min}
					max={GUTTER_RATIO.max}
					step={1}
					format={percent}
					onChange={(gutterY) => set({ gutterY })}
					className={RANGE_WIDTH}
				/>
			) : null,
		],
		[
			showGuides ? (
				<ControllerRow key="guides" label="그리드" className={RANGE_WIDTH}>
					<ControllerSegmented
						options={GUIDE_OPTIONS}
						value={guidesOn ? 'on' : 'off'}
						onChange={(next) => set({ guidesOn: next === 'on' })}
						aria-label="그리드 표시"
					/>
				</ControllerRow>
			) : null,
		],
	]
		.map((group) => group.filter(Boolean))
		.filter((group) => group.length > 0)

	// 전부 고정이면 알약이 없다 — 값을 심는 역할만 한다.
	if (groups.length === 0) return null

	return (
		<>
			{groups.map((group, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: 조합은 admin 플래그로 정해지고 재정렬되지 않는다.
				<Fragment key={index}>
					{index > 0 && <Separator orientation="vertical" className="h-6" />}
					{group}
				</Fragment>
			))}
		</>
	)
}

export default LayoutGridControlsWidget
