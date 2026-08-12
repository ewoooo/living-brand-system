'use client'

import { useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { GUTTER_RATIO, MARGIN_PCT } from '../layout-grid/rules'
import { useLayoutGridScope } from '../layout-grid/store'
import { CONTROL_VALUE, WIDGET_CAPTION } from '../readout'

// 위젯: 같은 **블록**의 layoutGridWidget들을 통제한다. 값은 블록 단위 스코프(layout-grid/store.tsx)에
// 있어 형제 위젯끼리 공유되고, 이 위젯이 유일한 쓰기 주체다. 다른 블록의 패널과는 간섭하지 않는다.
//
// 🔑 조절 허용 여부가 페이지별 템플릿을 만든다: 허용하면 슬라이더가 나오고 admin 값은 초기값이 되며,
//    허용하지 않으면 슬라이더가 없으므로 admin 값이 고정값이 된다.
// 🔴 슬라이더 범위는 정본 규칙(rules.ts)이다. 넓히면 규칙이 깨진다.

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

	// 전부 고정이면 패널이 없다 — 값을 심는 역할만 한다.
	if (!showMargin && !showGutterX && !showGutterY && !showGuides) return null

	return (
		// 블록 헤더(제목·설명 영역)에 놓이므로 페이지 배경 위다 — 텍스트는 전경색 토큰을 쓴다.
		<div className="flex w-fit flex-col gap-2 text-foreground">
			{showMargin && (
				<Slider
					label="마진 (대지 → 표)"
					value={marginPct}
					onChange={(marginPct) => set({ marginPct })}
					min={MARGIN_PCT.min}
					max={MARGIN_PCT.max}
					step={0.1}
					suffix="% (긴 축)"
				/>
			)}
			{showGutterX && (
				<Slider
					label="수평 거터"
					value={gutterX}
					onChange={(gutterX) => set({ gutterX })}
					min={GUTTER_RATIO.min}
					max={GUTTER_RATIO.max}
					step={1}
					suffix="% (마진)"
				/>
			)}
			{showGutterY && (
				<Slider
					label="수직 거터"
					value={gutterY}
					onChange={(gutterY) => set({ gutterY })}
					min={GUTTER_RATIO.min}
					max={GUTTER_RATIO.max}
					step={1}
					suffix="% (마진)"
				/>
			)}
			{showGuides && (
				<div className="flex flex-wrap items-center gap-2">
					<Switch
						id="layout-grid-guides"
						size="sm"
						checked={guidesOn}
						onCheckedChange={(next) => set({ guidesOn: next })}
					/>
					<Label htmlFor="layout-grid-guides" className="font-body text-xs">
						그리드 {guidesOn ? '보임' : '숨김'}
					</Label>
					<p className={WIDGET_CAPTION}>
						거터를 끝까지 밀어도 1:2:3 분할선은 제자리에 있다.
					</p>
				</div>
			)}
		</div>
	)
}

export default LayoutGridControlsWidget

function Slider({
	label,
	value,
	onChange,
	min,
	max,
	step,
	suffix,
}: {
	label: string
	value: number
	onChange: (value: number) => void
	min: number
	max: number
	step: number
	suffix: string
}) {
	return (
		// 🔴 슬라이더 폭은 고정이다(fill 아님) — 블록 폭이 바뀌어도 조작감이 같아야 한다.
		<label className="flex w-[240px] flex-col gap-0.5">
			<span className="flex items-baseline justify-between font-body text-xs">
				<span className="text-muted-foreground">{label}</span>
				<span className={`${CONTROL_VALUE} text-xs`}>
					{value}
					{suffix}
				</span>
			</span>
			<input
				type="range"
				value={value}
				min={min}
				max={max}
				step={step}
				onChange={(event) => onChange(Number(event.target.value))}
				className="w-[240px]"
			/>
		</label>
	)
}
