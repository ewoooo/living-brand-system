'use client'

import { useState } from 'react'
import {
	buildSpec,
	dimensions,
	FOOTNOTE,
	type Form,
	type GridSpec,
	LANG_OPTIONS,
	type Lang,
	type Slot,
	SYMBOL,
	SYMBOL_SLOT,
} from './rules'

// 자회사 CI 그리드 스펙 다이어그램(클라). 상태는 국문/영문 탭 하나뿐이라 store.tsx를 두지 않는다.
// 🔑 규정이 정한 것은 "칸의 높이"이고 글자는 그 칸을 채우는 내용이다. 그래서 칸마다 얇은 외곽선을
//    두고 치수선이 그 칸을 가리키게 했다 — 글자 잉크 높이를 재는 그림으로 오독되지 않게.
// 🔴 라벨 없는 칸은 문서에 값이 없는 잔여 여백이다. 치수선을 안 그리는 것이 규약이다(rules.ts).
// 🔴 HD 웹폰트는 로고 글자만 서브셋돼 있다. 자회사명에 없는 글자가 오면 대체 서체로 떨어진다.
// ponytail: 컨테이너는 'inline-size' + cqw. 'size'는 definite height를 요구해 판형 비율을 지어내야
//    하고 그러면 세로형이 잘린다. 높이는 규격이 정하므로 콘텐츠가 정하게 둔다.

/** 다이어그램의 H(심볼 높이) = 컨테이너 폭의 이 %. 표시 배율이며 규정이 아니다. */
const H_CQW = 13
const u = (h: number) => `${h * H_CQW}cqw`

export function LogoGridSpecView({
	form,
	nameKo,
	enLines,
}: {
	form: Form
	nameKo: string
	enLines: string[]
}) {
	const [lang, setLang] = useState<Lang>('ko')
	const spec = buildSpec(form, lang, nameKo, enLines)

	return (
		<div className="flex w-full flex-col gap-4">
			{/* 선택 상태를 색만으로 구분하지 않는다 — 굵기와 밑줄이 같이 바뀐다. */}
			<div className="flex gap-1">
				{LANG_OPTIONS.map((option) => {
					const on = lang === option.value
					return (
						<button
							key={option.value}
							type="button"
							aria-pressed={on}
							onClick={() => setLang(option.value)}
							className={`border-b-2 px-3 py-1 font-body text-sm focus-visible:outline-2 ${
								on
									? 'border-foreground font-semibold text-foreground'
									: 'border-transparent font-normal text-muted-foreground hover:bg-muted'
							}`}
						>
							{option.label}
						</button>
					)
				})}
			</div>

			<div
				className="w-full overflow-x-auto px-10 py-8"
				style={{ containerType: 'inline-size' }}
			>
				<Lockup spec={spec} />
			</div>

			<dl className="flex flex-col gap-1 font-mono text-xs">
				{dimensions(spec).map((d) => (
					<div key={d.name} className="flex gap-3">
						<dt className="min-w-[11rem] text-muted-foreground">{d.name}</dt>
						<dd className="tabular-nums">{d.value}</dd>
					</div>
				))}
			</dl>

			<p className="font-body text-muted-foreground text-xs">{FOOTNOTE}</p>
		</div>
	)
}

export default LogoGridSpecView

function Lockup({ spec }: { spec: GridSpec }) {
	if (spec.direction === 'column') {
		return (
			<div className="flex w-fit items-start">
				{/* 왼쪽 레일 — 심볼 높이와 심볼–로고타입 간격 */}
				<div className="flex flex-col">
					<Dim axis="y" extent={SYMBOL_SLOT.h} label={SYMBOL_SLOT.label} side="start" />
					<Dim axis="y" extent={spec.gap.h} label={spec.gap.label} side="start" />
				</div>
				<div className="flex flex-col items-center">
					<SymbolMark />
					<div style={{ height: u(spec.gap.h) }} />
					<Stack slot={spec.block} align="center" />
				</div>
				{/* 오른쪽 레일 — 로고타입 영역과 그 안의 행들. 위는 심볼+간격만큼 비운다. */}
				<div className="flex flex-col">
					<Dim axis="y" extent={SYMBOL_SLOT.h + spec.gap.h} />
					<Bars slots={[spec.block]} />
				</div>
			</div>
		)
	}

	return (
		<div className="flex w-fit items-center">
			<Dim axis="y" extent={SYMBOL_SLOT.h} label={SYMBOL_SLOT.label} side="start" />
			{spec.leftMargin ? (
				<Dim axis="x" extent={spec.leftMargin.h} label={spec.leftMargin.label} />
			) : null}
			<SymbolMark />
			<Dim axis="x" extent={spec.gap.h} label={spec.gap.label} />
			<Stack slot={spec.block} align="start" />
			<Bars slots={[spec.block]} />
		</div>
	)
}

/** 심볼 — 기본형은 파일에 색이 박혀 있어 그대로 쓴다(금지 6: 색상 임의 변경 불가). */
function SymbolMark() {
	return (
		// biome-ignore lint/performance/noImgElement: 정적 SVG라 next/image 미사용.
		<img
			src={SYMBOL.src}
			alt=""
			className="block shrink-0"
			style={{ height: u(SYMBOL_SLOT.h), width: u(SYMBOL_SLOT.h * SYMBOL.aspect) }}
		/>
	)
}

/** 로고타입 스택. rows가 있으면 그 안에서 다시 쌓인다(영문 하단 영역). */
function Stack({ slot, align }: { slot: Slot; align: 'start' | 'center' }) {
	if (!slot.rows) return <Glyph slot={slot} />
	return (
		<div className={`flex flex-col ${align === 'center' ? 'items-center' : 'items-start'}`}>
			{slot.rows.map((row, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: 규격 상수에서 온 고정 배열, 재정렬 없음.
				<Stack key={i} slot={row} align={align} />
			))}
		</div>
	)
}

/** 규정이 정한 칸(높이 h) 하나. 글자가 없으면 여백만 차지한다. */
function Glyph({ slot }: { slot: Slot }) {
	if (!slot.text) return <div style={{ height: u(slot.h) }} />
	return (
		// font-size = 칸 높이(em box). ci-lockup과 같은 가정이며 자간·행간을 손으로 맞추지 않는다.
		// 🔴 0.65H가 em box인지 cap height인지는 브랜드팀 미확인 — 확정되면 두 위젯을 같이 고친다.
		// outline-offset -0.5px = 선이 칸 경계를 안팎 0.5px씩 걸치게 해 이웃 칸과 겹쳐도 안 굵어진다.
		<div
			className="w-fit whitespace-pre text-foreground outline-1 outline-border"
			style={{
				height: u(slot.h),
				fontFamily: 'HD, sans-serif',
				fontWeight: 700,
				fontSize: u(slot.h),
				lineHeight: 1,
				outlineOffset: '-0.5px',
			}}
		>
			{slot.text}
		</div>
	)
}

/** 치수선 세로 스택(오른쪽 레일). 칸 순서대로 높이를 차지하고, 하위 행은 한 칸 더 바깥에 그린다. */
function Bars({ slots }: { slots: Slot[] }) {
	return (
		<div className="flex flex-col">
			{slots.map((slot, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: 규격 상수에서 온 고정 배열, 재정렬 없음.
				<div key={i} className="flex">
					<Dim
						axis="y"
						extent={slot.h}
						label={slot.unspec ? '?' : slot.label}
						dashed={slot.unspec}
					/>
					{slot.rows ? <Bars slots={slot.rows} /> : null}
				</div>
			))}
		</div>
	)
}

/** 치수선 하나. 재는 길이는 extent(H 배수)가 정하고 라벨만 바깥으로 띄운다. 라벨이 없으면 빈 자리. */
function Dim({
	axis,
	extent,
	label,
	side = 'end',
	dashed = false,
}: {
	axis: 'x' | 'y'
	extent: number
	label?: string
	side?: 'start' | 'end'
	dashed?: boolean
}) {
	const style = axis === 'y' ? { height: u(extent) } : { width: u(extent) }
	if (!label) return <div className="shrink-0" style={style} />

	const line = dashed ? 'border-dashed' : ''
	const text =
		'-translate-y-1/2 absolute top-1/2 whitespace-nowrap font-mono text-muted-foreground text-xs tabular-nums'

	if (axis === 'y') {
		return (
			<div className="relative w-7 shrink-0" style={style}>
				<div className={`absolute inset-y-0 left-1/2 border-border border-l ${line}`} />
				<div className="absolute inset-x-1.5 top-0 border-border border-t" />
				<div className="absolute inset-x-1.5 bottom-0 border-border border-t" />
				<span
					className={`${text} ${side === 'start' ? 'right-full mr-1' : 'left-full ml-1'}`}
				>
					{label}
				</span>
			</div>
		)
	}

	return (
		<div className="relative h-6 shrink-0" style={style}>
			<div className={`absolute inset-x-0 top-1/2 border-border border-t ${line}`} />
			<div className="absolute inset-y-1.5 left-0 border-border border-l" />
			<div className="absolute inset-y-1.5 right-0 border-border border-l" />
			<span className="-translate-x-1/2 absolute bottom-full left-1/2 mb-1 whitespace-nowrap font-mono text-muted-foreground text-xs tabular-nums">
				{label}
			</span>
		</div>
	)
}
