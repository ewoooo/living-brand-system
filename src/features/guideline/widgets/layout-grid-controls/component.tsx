'use client'

import {
	GUTTER_RATIO,
	MARGIN_PCT,
	setLayoutGridControls,
	useLayoutGridControls,
} from '../layout-grid/store'

// 위젯: 같은 페이지의 layoutGridWidget 전부를 한 패널로 통제한다.
// 값은 layout-grid/store.ts(모듈 스토어)에 있어 형제 위젯끼리 공유된다 — 이 위젯이 유일한 쓰기 주체다.
// 🔴 슬라이더 범위가 정본 규칙(마진 3~6%·거터 마진의 0~100%)이다. 범위를 넓히면 규칙이 깨진다.

export function LayoutGridControlsWidget() {
	const { marginPct, gutterX, gutterY, guidesOn } = useLayoutGridControls()

	return (
		// 어두운 블록 배경 전제로 밝은 패널. Block이 배경을 소유하므로 위젯은 반투명만 얹는다.
		<div className="flex w-full flex-col gap-2 rounded-md bg-white/10 p-3 text-white">
			<Slider
				label="마진 (대지 → 표)"
				value={marginPct}
				onChange={(marginPct) => setLayoutGridControls({ marginPct })}
				min={MARGIN_PCT.min}
				max={MARGIN_PCT.max}
				step={0.1}
				suffix="% (축 길이)"
			/>
			<Slider
				label="수평 거터"
				value={gutterX}
				onChange={(gutterX) => setLayoutGridControls({ gutterX })}
				min={GUTTER_RATIO.min}
				max={GUTTER_RATIO.max}
				step={1}
				suffix="% (마진)"
			/>
			<Slider
				label="수직 거터"
				value={gutterY}
				onChange={(gutterY) => setLayoutGridControls({ gutterY })}
				min={GUTTER_RATIO.min}
				max={GUTTER_RATIO.max}
				step={1}
				suffix="% (마진)"
			/>
			<div className="flex flex-wrap items-center gap-2">
				<button
					type="button"
					onClick={() => setLayoutGridControls({ guidesOn: !guidesOn })}
					aria-pressed={guidesOn}
					className="inline-flex items-center gap-2 rounded border border-white/30 px-2 py-1 font-body text-xs hover:bg-white/10"
				>
					<span
						className={`h-2 w-2 rounded-full ${guidesOn ? 'bg-white' : 'bg-white/30'}`}
					/>
					그리드 {guidesOn ? '보임' : '숨김'}
				</button>
				<p className="font-body text-white/60 text-xs">
					거터를 끝까지 밀어도 1:2:3 분할선은 제자리에 있다.
				</p>
			</div>
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
		<label className="flex flex-col gap-0.5">
			<span className="flex items-baseline justify-between font-body text-xs">
				<span className="opacity-70">{label}</span>
				<span className="tabular-nums">
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
				className="w-full"
			/>
		</label>
	)
}
