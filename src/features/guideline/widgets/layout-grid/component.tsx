'use client'

import type { StaticImageData } from 'next/image'
import type { CSSProperties, ReactNode } from 'react'
import sampleA1 from './images/sample-a1.webp'
import sampleA2 from './images/sample-a2.webp'
import sampleA3 from './images/sample-a3.webp'
import sampleB1 from './images/sample-b1.webp'
import sampleC1 from './images/sample-c1.webp'
import sampleC2 from './images/sample-c2.webp'
import { useLayoutGridControls } from './store'

// 위젯: HD현대 Key Layout 그리드(정본 규칙) 체험. 판형을 축별로 1:2:3으로 나눈 9셀에 콘텐츠를 스냅한다.
// 목적 = 마진·거터를 움직여봐도 1:2:3 분할선은 그대로라는 걸 눈으로 확인시키는 것.
// 인스턴스는 샘플 하나(sample)만 렌더하고, 폭은 컨테이너를 채운다(높이는 A4 비율로 파생).
// 마진·거터 값은 layoutGridControlsWidget이 소유한다(store.ts) — 페이지의 판형 전체가 한 패널로 움직인다.
//
// 🔴 규칙 상수(TRACKS)는 정본이다. 눈대중으로 고치지 말 것.
// 샘플 콘텐츠(SAMPLES)는 코드로만 편집한다 — author UI 대상이 아니다.

/** 축별 트랙 비율. 좌상단부터 1:2:3 (가로·세로 동일 규칙, 단위는 축별로 다름). */
const TRACKS = [1, 2, 3]

/** 판형 = A4 세로. 폭은 컨테이너가 주고 높이는 이 비율로 나온다. */
const ARTBOARD_ASPECT = '210 / 297'

const TRACK_TOTAL = TRACKS.reduce((sum, t) => sum + t, 0)

export type LayoutGridSample = 'a' | 'b' | 'c'

/** 셀 하나에 놓이는 콘텐츠. 셀 밖으로 넘치는 건 병합이 아니라 overflow다(판형 경계에서만 잘림). */
type Item = { col: number; row: number; node: ReactNode }
/** backdrop = 그리드 뒤에 판형 전체를 덮는 배경(풀블리드 사진). 셀에 속하지 않는다. */
type Sample = { background: string; color: string; backdrop?: ReactNode; items: Item[] }

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
			// 녹색 그라디언트 — 3A 열 × 1A 행 셀을 채운다.
			{ col: 3, row: 1, node: <Img src={sampleA1} /> },
			{ col: 1, row: 2, node: <Caption>FUTURE CLOSER TO HUMANITY</Caption> },
			// 선박 선수 — 셀보다 넓게 잡아 오른쪽으로 넘긴다(병합이 아니라 overflow).
			{ col: 2, row: 2, node: <Img src={sampleA2} style={{ width: '200%' }} /> },
			// 탱커 — 마진 밖으로 넘겨 판형 경계에서 잘리는 풀블리드.
			{
				col: 1,
				row: 3,
				node: (
					<Img
						src={sampleA3}
						style={{ width: '320%', marginLeft: '-6cqw', marginBottom: '-8cqh' }}
					/>
				),
			},
		],
	},
	b: {
		background: '#12202e',
		color: '#ffffff',
		// 풍력 터빈 — 판형 전체를 덮는 배경. 셀에 속하지 않는다.
		backdrop: <Img src={sampleB1} />,
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
		],
	},
	c: {
		background: '#ffffff',
		color: '#1a1a1a',
		items: [
			// 항만 밴드 — 마진 위쪽으로 넘겨 판형 상단에 붙인다.
			{
				col: 1,
				row: 1,
				node: (
					<Img
						src={sampleC1}
						style={{ width: '320%', marginLeft: '-6cqw', marginTop: '-8cqh' }}
					/>
				),
			},
			{ col: 1, row: 2, node: <Title>2026</Title> },
			{ col: 2, row: 2, node: <Title>FUTURE BUILDER</Title> },
			{
				col: 3,
				row: 2,
				node: (
					<div className="flex h-full flex-col justify-end gap-[2cqh]">
						<Caption>WE BRING THE FUTURE CLOSER TO HUMANITY</Caption>
						<div style={{ height: '5cqh' }}>
							<Logo />
						</div>
					</div>
				),
			},
			// 잠수함 — 하단 3A 행을 채우고 마진 밖으로 넘긴다.
			{
				col: 1,
				row: 3,
				node: (
					<Img
						src={sampleC2}
						style={{ width: '320%', marginLeft: '-6cqw', marginBottom: '-8cqh' }}
					/>
				),
			},
		],
	},
}

export function LayoutGridWidget({ sample }: { sample?: LayoutGridSample | null }) {
	const { marginPct, gutterX, gutterY, guidesOn } = useLayoutGridControls()

	const design = SAMPLES[sample ?? 'a']
	// 거터의 절반을 셀 안쪽 경계에 넣는다. 마진의 %라서 단위는 축별 cq(1cqw=판형 폭의 1%).
	const gutterHalf = { x: (marginPct * gutterX) / 100 / 2, y: (marginPct * gutterY) / 100 / 2 }

	return (
		// 판형 — 폭은 컨테이너를 채우고 높이는 A4 비율로 파생. cq 단위의 기준 컨테이너다.
		<div
			className="relative w-full overflow-hidden"
			style={{
				aspectRatio: ARTBOARD_ASPECT,
				containerType: 'size',
				background: design.background,
				color: design.color,
			}}
		>
			{design.backdrop ? <div className="absolute inset-0">{design.backdrop}</div> : null}

			{/* 표(9셀 전체) — 마진은 여기까지만 적용된다. 셀은 자기 마진이 없고 거터로만 벌어진다. */}
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

/** 사진. 기본은 놓인 영역을 꽉 채우고(cover), style로 셀 밖으로 넘기거나 크기를 조절한다. */
function Img({ src, style }: { src: StaticImageData; style?: CSSProperties }) {
	return (
		// biome-ignore lint/performance/noImgElement: 위젯 내부 정적 에셋이라 next/image 미사용(기존 위젯 선례).
		<img
			src={src.src}
			alt=""
			// max-w-none 필수 — preflight의 img{max-width:100%}가 셀 밖으로 넘기는 width를 100%로 되돌린다.
			className="block max-w-none"
			style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
		/>
	)
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
