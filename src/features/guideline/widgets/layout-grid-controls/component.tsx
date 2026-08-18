'use client'

import { Fragment, type ReactNode, useEffect, useId } from 'react'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { GUTTER_RATIO, MARGIN_PCT } from '../layout-grid/rules'
import { useLayoutGridScope } from '../layout-grid/store'
import { SPEC_READOUT } from '../readout'

// 위젯: 같은 **블록**의 layoutGridWidget들을 통제한다. 값은 블록 단위 스코프(layout-grid/store.tsx)에
// 있어 형제 위젯끼리 공유되고, 이 위젯이 유일한 쓰기 주체다. 다른 블록의 패널과는 간섭하지 않는다.
//
// 화면에서의 자리는 블록 헤더가 아니라 **하단 Floating Controller**다(components/globals/guideline-helper.tsx).
// 이 위젯은 자기 위치를 모른다 — 알약의 내용물만 그리고, 어디에 뜰지는 Helper가 정한다.
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
		showMargin
			? [
					<ValueRange
						key="margin"
						label="마진"
						value={marginPct}
						onChange={(marginPct) => set({ marginPct })}
						min={MARGIN_PCT.min}
						max={MARGIN_PCT.max}
						step={0.1}
						valueText={`판형 긴 축의 ${marginPct}%`}
					/>,
				]
			: [],
		[
			showGutterX ? (
				<ValueRange
					key="gutter-x"
					label="수평 거터"
					value={gutterX}
					onChange={(gutterX) => set({ gutterX })}
					min={GUTTER_RATIO.min}
					max={GUTTER_RATIO.max}
					step={1}
					valueText={`마진의 ${gutterX}%`}
				/>
			) : null,
			showGutterY ? (
				<ValueRange
					key="gutter-y"
					label="수직 거터"
					value={gutterY}
					onChange={(gutterY) => set({ gutterY })}
					min={GUTTER_RATIO.min}
					max={GUTTER_RATIO.max}
					step={1}
					valueText={`마진의 ${gutterY}%`}
				/>
			) : null,
		].filter(Boolean),
		showGuides
			? [
					<GuidesToggle
						key="guides"
						guidesOn={guidesOn}
						onChange={(guidesOn) => set({ guidesOn })}
					/>,
				]
			: [],
	].filter((group) => group.length > 0)

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

/**
 * Figma `Value Range`(61:4673) — 라벨과 값이 얹힌 채 판이 차오르는 슬라이더.
 * 🔴 `<label>`로 감싸는 방식은 안 통한다: Radix 슬라이더의 `role="slider"`는 손잡이(span)라
 *    for/id가 걸리지 않는다. 보이는 라벨을 그대로 이름으로 쓰려면 `aria-labelledby`로 가리켜야 한다.
 */
function ValueRange({
	label,
	value,
	onChange,
	min,
	max,
	step,
	valueText,
}: {
	label: string
	value: number
	onChange: (value: number) => void
	min: number
	max: number
	step: number
	/** 화면의 `75%`만으로는 무엇에 대한 비율인지 알 수 없다 — 그 기준을 소리로 읽어 준다. */
	valueText: string
}) {
	const labelId = useId()

	return (
		// 🔴 폭은 고정이다(fill 아님) — 알약이 담기는 자리가 달라져도 조작감이 같아야 한다.
		<Slider
			variant="fill"
			className="w-[180px]"
			value={[value]}
			min={min}
			max={max}
			step={step}
			onValueChange={([next]) => onChange(next ?? value)}
			aria-labelledby={labelId}
			aria-valuetext={valueText}
		>
			<span className="pointer-events-none absolute inset-0 flex items-center justify-between px-3">
				<span id={labelId} className="text-muted-foreground text-sm">
					{label}
				</span>
				<span className={`${SPEC_READOUT} text-sm`}>{value}%</span>
			</span>
		</Slider>
	)
}

/** Figma `Toggle`(61:4693) — 라벨 + 붙은 2단 세그먼트. */
function GuidesToggle({
	guidesOn,
	onChange,
}: {
	guidesOn: boolean
	onChange: (guidesOn: boolean) => void
}) {
	const labelId = useId()

	return (
		<div className="flex h-9 w-[180px] items-center justify-between rounded-lg bg-foreground/5 py-0.5 pr-0.5 pl-3">
			<span id={labelId} className="text-muted-foreground text-sm">
				그리드
			</span>
			<ToggleGroup
				type="single"
				spacing={0}
				value={guidesOn ? 'on' : 'off'}
				// 같은 칸을 다시 눌러 빈 값이 되는 것은 막는다 — 둘 중 하나는 항상 참이다.
				onValueChange={(next) => next && onChange(next === 'on')}
				aria-labelledby={labelId}
			>
				<ToggleGroupItem value="on">보임</ToggleGroupItem>
				<ToggleGroupItem value="off">숨김</ToggleGroupItem>
			</ToggleGroup>
		</div>
	)
}
