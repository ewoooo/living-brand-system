'use client'

import type { StaticImageData } from 'next/image'
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react'
import ciHdHorizontalWhite from './images/ci-hd-horizontal-white.svg'
import ciKoHorizontal from './images/ci-ko-horizontal.svg'
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

export type LayoutGridSample = 'a' | 'b' | 'c'

/**
 * 그리드에 놓이는 콘텐츠. col·row는 콘텐츠 셀 인덱스(1~3)이고, `[시작, 끝]`이면 여러 칸을 걸친다
 * (예: col [2,3] = 2번 칸 왼변부터 3번 칸 오른변까지).
 * bleed에 준 변은 셀 경계 대신 **문서(대지) 끝**까지 뻗는다 — 마진이 그리드 트랙이라
 * 수치 계산 없이 선으로 지정된다. 예: 하단 풀블리드 = bleed ['left','right','bottom'].
 * 🔴 bleed한 변만 여백이 0이다. 표 내부 구분선에 닿는 변은 문서 끝까지 뻗는 이미지라도 거터를 받는다
 *    — 그리드 선에만 정렬되는 게 아니라 거터 슬라이더에 같이 반응해야 한다.
 * behind면 이미지 레이어(z-index 0)로 내려가 텍스트·CI 아래에 깔린다.
 */
type Item = { col: Span; row: Span; bleed?: Side[]; behind?: boolean; node: ReactNode }
type Span = number | [number, number]
type Side = 'top' | 'right' | 'bottom' | 'left'
type Sample = { background: string; color: string; items: Item[] }

const spanStart = (span: Span) => (Array.isArray(span) ? span[0] : span)
const spanEnd = (span: Span) => (Array.isArray(span) ? span[1] : span)

// ─────────────────────────────────────────────────────────────
// 샘플 콘텐츠 — 여기만 고치면 된다. 이미지는 이 폴더에 넣고 static import.
// 크기 단위는 cqw/cqh(판형 폭·높이의 1%)를 쓴다 — 판형이 커지든 작아지든 같은 그림이 나온다.
// 텍스트는 HD체 Bold다. 서브셋에 라틴 대문자·숫자가 다 들어 있어 대문자 문구면 안전하다(소문자는 없다).
// ─────────────────────────────────────────────────────────────
const SAMPLES: Record<LayoutGridSample, Sample> = {
	a: {
		background: '#ffffff',
		color: '#1a1a1a',
		items: [
			// CI 국문 가로형 — 셀 높이의 20%, 셀 밖으로 넘치게 둔다.
			{ col: 1, row: 1, node: <Ci src={ciKoHorizontal} height="20%" /> },
			// 녹색 그라디언트 — 3A 열 × 1A 행 셀을 채운다.
			{ col: 3, row: 1, behind: true, node: <Img src={sampleA1} /> },
			// 캡션도 셀 밖으로 넘치게 둔다(1A 열이 좁아 줄바꿈되는 것을 막는다).
			{ col: 1, row: 2, node: <Caption overflow>FUTURE CLOSER TO HUMANITY</Caption> },
			// 선박 선수 — 2번 칸 왼변부터 3번 칸 오른변까지.
			{ col: [2, 3], row: 2, behind: true, node: <Img src={sampleA2} /> },
			// 탱커 — 위는 1/2 구분선, 나머지 세 변은 문서 끝.
			{
				col: 1,
				row: 3,
				bleed: ['left', 'right', 'bottom'],
				behind: true,
				node: <Img src={sampleA3} />,
			},
		],
	},
	b: {
		background: '#12202e',
		color: '#ffffff',
		items: [
			// 풍력 터빈 — 네 변 모두 문서 끝(판형 전체 배경). 먼저 놓아 텍스트 아래에 깔린다.
			{
				col: 1,
				row: 1,
				bleed: ['top', 'right', 'bottom', 'left'],
				behind: true,
				node: <Img src={sampleB1} />,
			},
			// CI HD형 가로형(WHITE 워드마크 — 어두운 배경 규정) — 셀 높이의 20%, 넘침 허용.
			{ col: 1, row: 1, node: <Ci src={ciHdHorizontalWhite} height="20%" /> },
			{
				col: 2,
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
			// 항만 밴드 — 아래는 1/6 구분선, 나머지 세 변은 문서 끝.
			{
				col: 1,
				row: 1,
				bleed: ['top', 'left', 'right'],
				behind: true,
				node: <Img src={sampleC1} />,
			},
			{ col: 1, row: 2, node: <Title>2026</Title> },
			// 타이틀 — 1/2열 구분선(선 3)부터 3열 오른변(선 5)까지 채운다.
			{ col: [2, 3], row: 2, node: <FillTitle>FUTURE BUILDER</FillTitle> },
			// 본문 — 2열, 행 아래쪽. 타이틀과 같은 행이지만 세로 정렬이 달라 겹치지 않는다.
			{
				col: 2,
				row: 2,
				node: (
					<div className="flex h-full flex-col justify-end">
						<Caption>
							{
								'WE BRING THE FUTURE CLOSER TO\nHUMANITY BY STEERING INNOVATION\nAND DEFYING OUR LIMITS'
							}
						</Caption>
					</div>
				),
			},
			// CI 국문 가로형(a와 동일) — 우하단 정렬, 기존 크기의 1/2.
			{
				col: 3,
				row: 2,
				node: (
					<div className="flex h-full flex-col items-end justify-end">
						<Ci src={ciKoHorizontal} height="2.5cqh" />
					</div>
				),
			},
			// 잠수함 — 위는 1/2 구분선, 나머지 세 변은 문서 끝(네가 지정한 그 박스).
			{
				col: 1,
				row: 3,
				bleed: ['left', 'right', 'bottom'],
				behind: true,
				node: <Img src={sampleC2} />,
			},
		],
	},
}

export function LayoutGridWidget({ sample }: { sample?: LayoutGridSample | null }) {
	const { marginPct, gutterX, gutterY, guidesOn } = useLayoutGridControls()

	const design = SAMPLES[sample ?? 'a']
	// 거터의 절반을 셀 안쪽 경계에 넣는다. 마진의 %라서 단위도 마진과 같은 cqmax(긴 축의 1%).
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
			{/* 그리드가 대지 전체를 덮는다 — 양끝 마진 트랙 덕에 문서 경계도 그리드 선이 된다. */}
			<div className="absolute inset-0 grid" style={gridTemplate(marginPct)}>
				{design.items.map((item, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: 정적 샘플 배열, 재정렬 없음.
						key={index}
						// 텍스트·CI는 이미지 위에 온다(behind만 이미지 레이어).
						style={{
							...placement(item),
							...cellPadding(item, gutterHalf),
							position: 'relative',
							zIndex: item.behind ? 0 : 1,
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

/**
 * 대지 전체를 덮는 5×5 트랙. 양끝은 마진, 가운데 3개가 1:2:3 콘텐츠 트랙이다.
 * 선 번호: 1=문서끝 · 2=표끝 · 3=1/6 · 4=1/2 · 5=표끝 · 6(-1)=문서끝.
 * 마진을 트랙으로 두면 문서 경계까지 뻗는 요소를 수치 계산 없이 그리드 선으로 지정할 수 있다.
 */
function gridTemplate(marginPct: number): CSSProperties {
	// 마진 단위는 cqmax(= 판형 긴 축의 1%)다. 축마다 % 기준이 달라지지 않으니
	// 수직·수평 마진이 언제나 같은 길이가 된다 — 판형 종횡비가 뭐든.
	// 🔴 minmax(0, Nfr) 필수 — 맨 `Nfr`은 minmax(auto, Nfr)이라 사진의 intrinsic 크기가
	// 트랙을 밀어내 1:2:3이 깨진다(하한을 0으로 못 박아야 비율이 보존된다).
	const margin = `${marginPct}cqmax`
	const tracks = `${margin} ${TRACKS.map((t) => `minmax(0, ${t}fr)`).join(' ')} ${margin}`
	// 거터를 grid gap으로 주지 않는다 — gap은 남는 폭을 나눠 분할선을 밀어낸다.
	// 대신 셀 안쪽 padding으로 넣어 분할선을 1/6·1/2에 고정한다.
	return { gridTemplateColumns: tracks, gridTemplateRows: tracks }
}

/** 콘텐츠 셀 n번의 변 = 선 n+1(왼·위) / n+2(오른·아래). bleed를 준 변은 문서 끝 선(1 또는 -1)이다. */
function placement({ col, row, bleed = [] }: Item): CSSProperties {
	return {
		gridColumnStart: bleed.includes('left') ? 1 : spanStart(col) + 1,
		gridColumnEnd: bleed.includes('right') ? -1 : spanEnd(col) + 2,
		gridRowStart: bleed.includes('top') ? 1 : spanStart(row) + 1,
		gridRowEnd: bleed.includes('bottom') ? -1 : spanEnd(row) + 2,
	}
}

/** 거터의 절반씩을 셀 내부 경계에 넣는다. 표 바깥쪽 변과 문서 끝으로 bleed한 변만 거터가 없다. */
function cellPadding({ col, row, bleed = [] }: Item, half: Offsets): CSSProperties {
	const last = TRACKS.length
	return {
		paddingLeft: spanStart(col) > 1 && !bleed.includes('left') ? `${half.x}cqmax` : 0,
		paddingRight: spanEnd(col) < last && !bleed.includes('right') ? `${half.x}cqmax` : 0,
		paddingTop: spanStart(row) > 1 && !bleed.includes('top') ? `${half.y}cqmax` : 0,
		paddingBottom: spanEnd(row) < last && !bleed.includes('bottom') ? `${half.y}cqmax` : 0,
	}
}

/**
 * 표 프레임 + 1:2:3 분할선. 콘텐츠 셀 9개에 테두리를 그려 얻는다 — 위치 계산이 없다.
 * 색은 흰 선 + mix-blend-mode: difference = 배경 색상 반전이라 흰 대지에서도 사진 위에서도 보인다.
 * 🔴 outline-offset: -0.5px — 선이 셀 경계를 0.5px씩 안·밖으로 걸치게 해서, 이웃 셀의 선과
 *    정확히 겹쳐 1px로 보인다(offset 0이면 경계마다 0.5+0.5가 어긋나 2px로 두꺼워진다).
 */
function Guides({ marginPct }: { marginPct: number }) {
	return (
		<div
			className="pointer-events-none absolute inset-0 grid"
			style={{ ...gridTemplate(marginPct), mixBlendMode: 'difference' }}
		>
			{TRACKS.flatMap((_, rowIndex) =>
				TRACKS.map((__, colIndex) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: 고정 3×3 좌표, 재정렬 없음.
						key={`${colIndex}-${rowIndex}`}
						style={{
							gridColumn: colIndex + 2,
							gridRow: rowIndex + 2,
							outline: '1px solid #ffffff',
							outlineOffset: '-0.5px',
						}}
					/>
				)),
			)}
		</div>
	)
}

// ── 샘플 콘텐츠 조각 ────────────────────────────────────────

/**
 * CI 락업. 높이만 주고 폭은 원본 비율대로 두므로 가로형은 셀 밖으로 넘친다(overflow 허용).
 * 🔴 CI는 마스터 아트워크 그대로 쓴다 — 비율·색을 CSS로 바꾸지 않는다(금지 6·7).
 */
function Ci({ src, height }: { src: StaticImageData; height: string }) {
	return (
		// biome-ignore lint/performance/noImgElement: 정적 SVG라 next/image 미사용.
		<img
			// 🔴 .src를 써야 한다 — svg import는 StaticImageData 객체이고 타입이 any라
			//    객체를 그대로 넘겨도 typecheck를 통과한 뒤 런타임에 src="[object Object]"가 된다.
			src={src.src}
			alt=""
			// max-w-none 필수 — preflight의 img{max-width:100%}가 넘치는 폭을 셀 폭으로 되돌린다.
			className="block w-auto max-w-none"
			style={{ height }}
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

/** 위젯 텍스트는 전부 HD체 Bold. 서브셋에 소문자가 없어 대문자로 조판한다. */
const HD_BOLD: CSSProperties = { fontFamily: 'HD, sans-serif', fontWeight: 700 }

/** overflow면 줄바꿈 없이 셀 밖으로 넘긴다. 그 외에는 문자열의 개행을 그대로 지킨다. */
function Caption({ children, overflow }: { children: ReactNode; overflow?: boolean }) {
	return (
		<p
			className="uppercase leading-tight"
			style={{
				...HD_BOLD,
				fontSize: '1.3cqw',
				whiteSpace: overflow ? 'nowrap' : 'pre-line',
			}}
		>
			{children}
		</p>
	)
}

function Title({ children }: { children: ReactNode }) {
	return (
		<p className="uppercase leading-none" style={{ ...HD_BOLD, fontSize: '7cqw' }}>
			{children}
		</p>
	)
}

/**
 * 놓인 영역의 폭을 정확히 채우는 타이틀. 폰트 크기를 계산하지 않는다 —
 * 문자열을 한 번 실측해 그 비율로 viewBox를 잡으면, 이후 스케일은 SVG가 폭 100%에 맞춰 처리한다.
 * 실측은 문자열에만 의존하므로 컨테이너가 바뀌어도 다시 재지 않는다.
 * 🔴 글자 모양·자간은 그대로 늘어난다(scaleX 왜곡 없음).
 */
function FillTitle({ children }: { children: string }) {
	// em 1000 기준 cap height(HD체 실측 680)만큼만 높이로 잡아 대문자 상단이 0에 맞는다.
	const CAP = 680
	const [advance, setAdvance] = useState<number | null>(null)

	useEffect(() => {
		let alive = true
		// 폰트가 로드된 뒤 재야 폴백 폰트 폭으로 잘못 잡히지 않는다.
		document.fonts.ready.then(() => {
			const ctx = document.createElement('canvas').getContext('2d')
			if (!ctx || !alive) return
			ctx.font = '700 1000px HD, sans-serif'
			setAdvance(ctx.measureText(children).width)
		})
		return () => {
			alive = false
		}
	}, [children])

	// 실측 전에는 그리지 않는다 — 잘못된 크기로 한 프레임 튀는 것을 막는다.
	if (advance == null) return null

	return (
		<svg
			viewBox={`0 0 ${advance} ${CAP}`}
			preserveAspectRatio="xMinYMin meet"
			style={{ width: '100%', display: 'block' }}
		>
			<title>{children}</title>
			<text
				x={0}
				y={CAP}
				fontFamily="HD, sans-serif"
				fontWeight={700}
				fontSize={1000}
				fill="currentColor"
			>
				{children}
			</text>
		</svg>
	)
}
