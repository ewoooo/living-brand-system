'use client'

import { type CSSProperties, type ReactNode, useState } from 'react'

// 위젯: HD현대 Key Layout 그리드(정본 규칙) 체험. 판형을 축별로 1:2:3으로 나눈 9셀에 콘텐츠를 스냅한다.
// 목적 = 마진·거터를 움직여봐도 1:2:3 분할선은 그대로라는 걸 눈으로 확인시키는 것.
// 인스턴스는 샘플 하나(sample)만 렌더하고, 폭은 컨테이너를 채운다(높이는 A4 비율로 파생).
//
// 🔴 규칙 상수(TRACKS·MARGIN_PCT·GUTTER_RATIO)는 정본이다. 눈대중으로 고치지 말 것.
// 샘플 콘텐츠(SAMPLES)는 코드로만 편집한다 — author UI 대상이 아니다.

/** 축별 트랙 비율. 좌상단부터 1:2:3 (가로·세로 동일 규칙, 단위는 축별로 다름). */
const TRACKS = [1, 2, 3]

/** 마진 = 해당 축 길이의 3~6%. 축별로 각자의 길이에 적용된다(정사각형일 필요 없음). */
const MARGIN_PCT = { min: 3, max: 6, default: 4.5 }

/** 거터 = 마진의 50~100%. 수직·수평 따로. */
const GUTTER_RATIO = { min: 50, max: 100, default: 75 }

/** 판형 = A4 세로. 폭은 컨테이너가 주고 높이는 이 비율로 나온다. */
const ARTBOARD_ASPECT = '210 / 297'

const TRACK_TOTAL = TRACKS.reduce((sum, t) => sum + t, 0)

export type LayoutGridSample = 'a' | 'b' | 'c'

/** 셀 하나에 놓이는 콘텐츠. 셀 밖으로 넘치는 건 병합이 아니라 overflow다(판형 경계에서만 잘림). */
type Item = { col: number; row: number; node: ReactNode }
type Sample = { background: string; color: string; items: Item[] }

// ─────────────────────────────────────────────────────────────
// 샘플 콘텐츠 — 여기만 고치면 된다. 이미지는 이 폴더에 넣고 static import.
// 크기 단위는 cqw/cqh(판형 폭·높이의 1%)를 쓴다 — 판형이 커지든 작아지든 같은 그림이 나온다.
// 텍스트에 HD체를 쓰지 않는다: 서브셋 폰트라 CI 글자 외에는 글리프가 없다.
// ─────────────────────────────────────────────────────────────
const SAMPLES: Record<LayoutGridSample, Sample> = {
	a: {
		background: '#ffffff',
		color: '#1a1a1a',
		items: [
			{ col: 1, row: 1, node: <Logo /> },
			{ col: 3, row: 1, node: <Box color="#00af41" /> },
			{ col: 1, row: 2, node: <Caption>FUTURE CLOSER TO HUMANITY</Caption> },
			// overflow 예시: 셀보다 넓게 잡아 오른쪽으로 넘긴다(병합이 아니다).
			{ col: 2, row: 2, node: <Box color="#1f4e9c" style={{ width: '200%' }} /> },
			// 풀블리드 예시: 마진 밖으로 넘겨 판형 경계에서 잘리게 한다.
			{
				col: 1,
				row: 3,
				node: (
					<Box
						color="#0f6b45"
						style={{ width: '320%', marginLeft: '-6cqw', marginBottom: '-8cqh' }}
					/>
				),
			},
		],
	},
	b: {
		background: '#12202e',
		color: '#ffffff',
		items: [
			{ col: 1, row: 1, node: <Logo mono /> },
			{
				col: 1,
				row: 2,
				node: (
					<Caption>
						WE BRING THE FUTURE CLOSER TO HUMANITY BY STEERING INNOVATION AND DEFYING
						OUR LIMITS
					</Caption>
				),
			},
			// 풀블리드 배경 이미지 자리 — 판형 전체를 덮되 마진 밖까지 넘긴다.
			{
				col: 2,
				row: 3,
				node: (
					<Box
						color="#24405a"
						style={{ width: '260%', height: '130%', marginLeft: '-30cqw' }}
					/>
				),
			},
		],
	},
	c: {
		background: '#ffffff',
		color: '#1a1a1a',
		items: [
			// 상단 사진 밴드: 마진 위쪽으로 넘겨 판형 상단에 붙인다.
			{
				col: 1,
				row: 1,
				node: (
					<Box
						color="#6d7b86"
						style={{ width: '320%', marginLeft: '-6cqw', marginTop: '-8cqh' }}
					/>
				),
			},
			{ col: 1, row: 2, node: <Title>2026</Title> },
			{ col: 2, row: 2, node: <Title>FUTURE BUILDER</Title> },
			{ col: 1, row: 3, node: <Caption>WE BRING THE FUTURE CLOSER TO HUMANITY</Caption> },
			{ col: 3, row: 3, node: <Logo /> },
		],
	},
}

export function LayoutGridWidget({ sample }: { sample?: LayoutGridSample | null }) {
	const [marginPct, setMarginPct] = useState(MARGIN_PCT.default)
	const [gutterX, setGutterX] = useState(GUTTER_RATIO.default)
	const [gutterY, setGutterY] = useState(GUTTER_RATIO.default)
	const [guidesOn, setGuidesOn] = useState(true)

	const design = SAMPLES[sample ?? 'a']
	// 거터의 절반을 셀 안쪽 경계에 넣는다. 마진의 %라서 단위는 축별 cq(1cqw=판형 폭의 1%).
	const gutterHalf = { x: (marginPct * gutterX) / 100 / 2, y: (marginPct * gutterY) / 100 / 2 }

	return (
		<div className="flex w-full flex-col gap-3">
			{/* 컨트롤 — 어두운 블록 배경 전제로 밝은 패널. Block이 배경을 소유하므로 위젯은 배경 없이 반투명만. */}
			<div className="flex flex-col gap-2 rounded-md bg-white/10 p-3 text-white">
				<Slider
					label="마진"
					value={marginPct}
					onChange={setMarginPct}
					min={MARGIN_PCT.min}
					max={MARGIN_PCT.max}
					step={0.1}
					suffix="% (축 길이)"
				/>
				<Slider
					label="수평 거터"
					value={gutterX}
					onChange={setGutterX}
					min={GUTTER_RATIO.min}
					max={GUTTER_RATIO.max}
					step={1}
					suffix="% (마진)"
				/>
				<Slider
					label="수직 거터"
					value={gutterY}
					onChange={setGutterY}
					min={GUTTER_RATIO.min}
					max={GUTTER_RATIO.max}
					step={1}
					suffix="% (마진)"
				/>
				<button
					type="button"
					onClick={() => setGuidesOn((v) => !v)}
					aria-pressed={guidesOn}
					className="inline-flex items-center gap-2 self-start rounded border border-white/30 px-2 py-1 font-body text-xs hover:bg-white/10"
				>
					<span
						className={`h-2 w-2 rounded-full ${guidesOn ? 'bg-white' : 'bg-white/30'}`}
					/>
					그리드 {guidesOn ? '보임' : '숨김'}
				</button>
			</div>

			{/* 판형 — 폭은 컨테이너를 채우고 높이는 A4 비율로 파생. cq 단위의 기준 컨테이너다. */}
			<div
				className="relative w-full overflow-hidden"
				style={{
					aspectRatio: ARTBOARD_ASPECT,
					containerType: 'size',
					background: design.background,
					color: design.color,
				}}
			>
				<div
					className="absolute grid"
					style={{
						inset: `${marginPct}% ${marginPct}%`,
						// 거터를 grid gap으로 주지 않는다 — gap은 남는 폭을 나눠 분할선을 밀어낸다.
						// 대신 셀 안쪽 padding으로 넣어 분할선을 정확히 1/6·3/6에 고정한다.
						gridTemplateColumns: TRACKS.map((t) => `${t}fr`).join(' '),
						gridTemplateRows: TRACKS.map((t) => `${t}fr`).join(' '),
					}}
				>
					{design.items.map((item) => (
						<div
							key={`${item.col}-${item.row}`}
							style={{
								gridColumn: item.col,
								gridRow: item.row,
								...cellPadding(item, gutterHalf),
							}}
						>
							{item.node}
						</div>
					))}
				</div>

				{guidesOn && <Guides marginPct={marginPct} />}
			</div>
		</div>
	)
}

export default LayoutGridWidget

type Offsets = { x: number; y: number }

/** 거터의 절반씩을 셀 내부 경계에 넣는다. 판형 바깥쪽 변은 마진이 담당하므로 0. */
function cellPadding(item: Item, half: Offsets): CSSProperties {
	const last = TRACKS.length
	return {
		paddingLeft: item.col > 1 ? `${half.x}cqw` : 0,
		paddingRight: item.col < last ? `${half.x}cqw` : 0,
		paddingTop: item.row > 1 ? `${half.y}cqh` : 0,
		paddingBottom: item.row < last ? `${half.y}cqh` : 0,
	}
}

/** 마진 프레임 + 1:2:3 분할선. 누적 비율(1/6, 3/6) 위치는 거터와 무관하게 고정이다. */
function Guides({ marginPct }: { marginPct: number }) {
	// 트랙 경계의 누적 비율 — 마지막(=1)은 마진 프레임과 겹치므로 제외.
	let running = 0
	const cuts = TRACKS.slice(0, -1).map((track) => {
		running += track / TRACK_TOTAL
		return running
	})

	return (
		<div
			className="pointer-events-none absolute border border-current opacity-40"
			style={{ inset: `${marginPct}% ${marginPct}%` }}
		>
			{cuts.map((cut) => (
				<div
					key={`v-${cut}`}
					className="absolute top-0 h-full border-current border-l"
					style={{ left: `${cut * 100}%` }}
				/>
			))}
			{cuts.map((cut) => (
				<div
					key={`h-${cut}`}
					className="absolute left-0 w-full border-current border-t"
					style={{ top: `${cut * 100}%` }}
				/>
			))}
		</div>
	)
}

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

// ── 샘플 콘텐츠 조각 ────────────────────────────────────────

function Logo({ mono = false }: { mono?: boolean }) {
	return (
		// biome-ignore lint/performance/noImgElement: 정적 SVG라 next/image 미사용.
		<img
			src={mono ? '/symbols/symbol-mono.svg' : '/symbols/symbol-default.svg'}
			alt=""
			className="h-full w-auto"
			style={mono ? { filter: 'brightness(0) invert(1)' } : undefined}
		/>
	)
}

/** 색 박스 = 이미지 자리. style로 셀 밖으로 넘기거나 크기를 조절한다. */
function Box({ color, style }: { color: string; style?: CSSProperties }) {
	return <div style={{ background: color, width: '100%', height: '100%', ...style }} />
}

function Caption({ children }: { children: ReactNode }) {
	return (
		<p
			className="font-body font-semibold uppercase leading-tight"
			style={{ fontSize: '2.6cqw' }}
		>
			{children}
		</p>
	)
}

function Title({ children }: { children: ReactNode }) {
	return (
		<p className="font-body font-bold uppercase leading-none" style={{ fontSize: '7cqw' }}>
			{children}
		</p>
	)
}
