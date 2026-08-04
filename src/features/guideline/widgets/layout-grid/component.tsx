'use client'

import type { StaticImageData } from 'next/image'
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react'
import {
	CI_ART,
	COMPOSITIONS,
	type Element,
	PHOTOS,
	type Placement,
	type Span,
} from './compositions'
import type { LayoutGridSample } from './samples'
import { useLayoutGridControls } from './store'

// 템플릿: HD현대 Key Layout 그리드(정본 규칙). 판형을 축별로 1:2:3으로 나눈 9셀에 개체를 스냅한다.
// 이 파일은 레이아웃 시스템만 소유한다 — 그리드·마진·거터·가이드·개체 종류별 렌더.
// 무엇을 어디에 놓는가(조합)는 compositions.ts의 순수 데이터다. 조합을 늘려도 이 파일은 안 바뀐다.
// 마진·거터 값은 layoutGridControlsWidget이 소유한다(store.ts) — 페이지의 판형 전체가 한 패널로 움직인다.
//
// 🔴 규칙 상수(TRACKS)는 정본이다. 눈대중으로 고치지 말 것.

/** 축별 트랙 비율. 좌상단부터 1:2:3 (가로·세로 동일 규칙, 단위는 축별로 다름). */
const TRACKS = [1, 2, 3]

/** 판형 = A4 세로. 폭은 컨테이너가 주고 높이는 이 비율로 나온다. */
const ARTBOARD_ASPECT = '210 / 297'

const spanStart = (span: Span) => (Array.isArray(span) ? span[0] : span)
const spanEnd = (span: Span) => (Array.isArray(span) ? span[1] : span)

export function LayoutGridWidget({ sample }: { sample?: LayoutGridSample | null }) {
	const { marginPct, gutterX, gutterY, guidesOn } = useLayoutGridControls()

	const composition = COMPOSITIONS[sample ?? 'a']
	// 거터의 절반을 셀 안쪽 경계에 넣는다. 마진의 %라서 단위도 마진과 같은 cqmax(긴 축의 1%).
	const gutterHalf = { x: (marginPct * gutterX) / 100 / 2, y: (marginPct * gutterY) / 100 / 2 }

	return (
		// 판형 — 폭은 컨테이너를 채우고 높이는 A4 비율로 파생. cq 단위의 기준 컨테이너다.
		<div
			className="relative w-full overflow-hidden"
			style={{
				aspectRatio: ARTBOARD_ASPECT,
				containerType: 'size',
				background: composition.background,
				color: composition.color,
			}}
		>
			{/* 그리드가 대지 전체를 덮는다 — 양끝 마진 트랙 덕에 문서 경계도 그리드 선이 된다. */}
			<div className="absolute inset-0 grid" style={gridTemplate(marginPct)}>
				{composition.items.map((item, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: 정적 조합 배열, 재정렬 없음.
						key={index}
						style={{
							...placement(item),
							...cellPadding(item, gutterHalf),
							...alignment(item),
							// 텍스트·CI는 이미지 위에 온다(behind만 이미지 레이어).
							position: 'relative',
							zIndex: item.behind ? 0 : 1,
						}}
					>
						{renderElement(item.element)}
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
function placement({ col, row, bleed = [] }: Placement): CSSProperties {
	return {
		gridColumnStart: bleed.includes('left') ? 1 : spanStart(col) + 1,
		gridColumnEnd: bleed.includes('right') ? -1 : spanEnd(col) + 2,
		gridRowStart: bleed.includes('top') ? 1 : spanStart(row) + 1,
		gridRowEnd: bleed.includes('bottom') ? -1 : spanEnd(row) + 2,
	}
}

/** 거터의 절반씩을 셀 내부 경계에 넣는다. 표 바깥쪽 변과 문서 끝으로 bleed한 변만 거터가 없다. */
function cellPadding({ col, row, bleed = [] }: Placement, half: Offsets): CSSProperties {
	const last = TRACKS.length
	return {
		paddingLeft: spanStart(col) > 1 && !bleed.includes('left') ? `${half.x}cqmax` : 0,
		paddingRight: spanEnd(col) < last && !bleed.includes('right') ? `${half.x}cqmax` : 0,
		paddingTop: spanStart(row) > 1 && !bleed.includes('top') ? `${half.y}cqmax` : 0,
		paddingBottom: spanEnd(row) < last && !bleed.includes('bottom') ? `${half.y}cqmax` : 0,
	}
}

/** 셀 안에서의 정렬. 지정이 없으면 좌상단이라 flex를 쓰지 않는다(개체가 셀을 그대로 채운다). */
function alignment({ alignX, alignY }: Placement): CSSProperties {
	if (!alignX && !alignY) return {}
	return {
		display: 'flex',
		flexDirection: 'column',
		alignItems: alignX === 'end' ? 'flex-end' : 'flex-start',
		justifyContent: alignY === 'end' ? 'flex-end' : 'flex-start',
	}
}

/** 개체 종류 → 컴포넌트. 조합 데이터가 아는 것은 종류와 값뿐이고, 조판 규칙은 여기 있다. */
function renderElement(element: Element): ReactNode {
	switch (element.kind) {
		case 'photo':
			return <Photo src={PHOTOS[element.asset]} />
		case 'ci':
			return <Ci src={CI_ART[element.art]} height={element.height} mono={element.mono} />
		case 'caption':
			return <Caption>{element.text}</Caption>
		case 'title':
			return <Title>{element.text}</Title>
		case 'fillTitle':
			return <FillTitle>{element.text}</FillTitle>
	}
}

/** 마진 프레임 + 1:2:3 분할선. 콘텐츠 셀 9개에 테두리를 그려 얻는다 — 위치 계산이 없다. */
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
							// 🔴 outline-offset -0.5px — 선이 셀 경계를 안·밖 0.5px씩 걸치게 해서 이웃 셀의
							// 선과 정확히 겹쳐 1px로 보인다(0이면 경계마다 2px로 두꺼워진다).
							outline: '1px solid #ffffff',
							outlineOffset: '-0.5px',
						}}
					/>
				)),
			)}
		</div>
	)
}

// ── 개체 렌더 ────────────────────────────────────────────────

/**
 * CI 락업. 높이만 주고 폭은 원본 비율대로 두므로 가로형은 셀 밖으로 넘친다(overflow 허용).
 * 크기는 텍스트와 같은 대지 기준 단위(cqmax)라 셀 크기·거터에 따라 변하지 않는다.
 * 🔴 비율은 CSS로 바꾸지 않는다(금지 7).
 * mono = 단색 락업. 이 파일은 fill 선언이 없어(= 색을 입혀 쓰라고 비워둔 아트워크) 그대로 두면
 * SVG 기본값인 검정이다. 색을 넣는 것이 정상 사용이며, 여기서는 어두운 배경용 흰색으로 렌더한다.
 */
function Ci({ src, height, mono }: { src: StaticImageData; height: string; mono?: boolean }) {
	return (
		// biome-ignore lint/performance/noImgElement: 정적 SVG라 next/image 미사용.
		<img
			// 🔴 .src를 써야 한다 — svg import는 StaticImageData 객체이고 타입이 any라
			//    객체를 그대로 넘겨도 typecheck를 통과한 뒤 런타임에 src="[object Object]"가 된다.
			src={src.src}
			alt=""
			// max-w-none 필수 — preflight의 img{max-width:100%}가 넘치는 폭을 셀 폭으로 되돌린다.
			className="block w-auto max-w-none"
			style={{ height, filter: mono ? 'brightness(0) invert(1)' : undefined }}
		/>
	)
}

/** 사진. 놓인 영역을 꽉 채운다(cover). */
function Photo({ src }: { src: StaticImageData }) {
	return (
		// biome-ignore lint/performance/noImgElement: 위젯 내부 정적 에셋이라 next/image 미사용(기존 위젯 선례).
		<img
			src={src.src}
			alt=""
			// max-w-none 필수 — preflight의 img{max-width:100%}가 셀 밖으로 넘기는 width를 100%로 되돌린다.
			className="block max-w-none"
			style={{ width: '100%', height: '100%', objectFit: 'cover' }}
		/>
	)
}

/** 위젯 텍스트는 전부 HD체 Bold. 서브셋에 소문자가 없어 대문자로 조판한다. */
const HD_BOLD: CSSProperties = { fontFamily: 'HD, sans-serif', fontWeight: 700 }

/** 본문. 문자열의 개행을 그대로 지킨다(pre-line). */
function Caption({ children }: { children: ReactNode }) {
	return (
		<p
			className="uppercase leading-tight"
			style={{ ...HD_BOLD, fontSize: '1.3cqw', whiteSpace: 'pre-line' }}
		>
			{children}
		</p>
	)
}

/** 큰 타이틀. line-height 100% — 행간 여백 없이 글자 높이만 차지한다. */
function Title({ children }: { children: ReactNode }) {
	return (
		<p className="uppercase" style={{ ...HD_BOLD, fontSize: '3.5cqw', lineHeight: '100%' }}>
			{children}
		</p>
	)
}

/**
 * 놓인 영역의 폭을 정확히 채우는 타이틀. 폰트 크기를 계산하지 않는다 —
 * 문자열의 잉크 경계를 한 번 실측해 viewBox로 쓰면, 이후 스케일은 SVG가 폭 100%에 맞춰 처리한다.
 * 실측은 문자열에만 의존하므로 컨테이너가 바뀌어도 다시 재지 않는다.
 * 🔴 글자 모양·자간은 그대로 늘어난다(scaleX 왜곡 없음).
 * 🔴 cap height를 높이로 가정하면 안 된다 — 둥근 대문자(U·D·B)는 베이스라인 아래로 오버슈트가
 *    있어 글자 아래가 잘린다. actualBoundingBox로 실제 잉크 상·하·좌·우를 받아 그만큼만 잡는다.
 */
function FillTitle({ children }: { children: string }) {
	const [ink, setInk] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

	useEffect(() => {
		let alive = true
		// 폰트가 로드된 뒤 재야 폴백 폰트 지표로 잘못 잡히지 않는다.
		document.fonts.ready.then(() => {
			const ctx = document.createElement('canvas').getContext('2d')
			if (!ctx || !alive) return
			ctx.font = '700 1000px HD, sans-serif'
			const m = ctx.measureText(children)
			// 기준점은 (0, 베이스라인). left는 기준점 왼쪽 방향이 양수라 부호를 뒤집는다.
			setInk({
				x: -m.actualBoundingBoxLeft,
				y: -m.actualBoundingBoxAscent,
				w: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
				h: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
			})
		})
		return () => {
			alive = false
		}
	}, [children])

	// 실측 전에는 그리지 않는다 — 잘못된 크기로 한 프레임 튀는 것을 막는다.
	if (!ink) return null

	return (
		<svg
			viewBox={`${ink.x} ${ink.y} ${ink.w} ${ink.h}`}
			preserveAspectRatio="xMinYMin meet"
			style={{ width: '100%', display: 'block' }}
		>
			<title>{children}</title>
			<text
				x={0}
				y={0}
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
