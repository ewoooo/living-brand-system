'use client'

import { type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { MORPH, MORPH_EASING, MORPH_MS, reducedMotion } from './motion'
import { type DiagramSpec, type DiagramTrack, diagramSpec, type Lockup } from './rules'
import { CapLine, SymbolMark } from './view'

/*
 * 치수 도판. 🔑 **락업을 CSS grid 한 판의 트랙 시퀀스로 그린다** — 요소 트랙은 `max-content`라
 * 글자 폭을 폰트가 정하고(이 리포의 결정: "폭은 계산하지 않는다"), 간격 트랙은 H 배수로 고정된다.
 * 그래서 계열사·지역명·언어가 바뀌어도 **JS 측정 없이** 치수선이 따라온다.
 *
 * 🔑 꼴이 바뀌어도 노드가 다시 만들어지지 않는다. 정체 id를 key로 쓰고(그 id는 **축을 담지 않는다**,
 *    `rules.ts` 참조) 바뀌는 것은 grid 배치뿐이며, 그 이동을 FLIP이 이어 준다.
 *    사용자 요구(2026-08-18): 「꼴을 변경했을 때 새로 바뀌는 게 아니라 이동만 하는 거지」
 *
 * 🔴 클리어스페이스(여백)는 여기 없다 — 간격과 아예 다른 규정이고 이번 범위 밖이다.
 */

/** 라벨행 높이(px). 🔴 절대 px이다 — H가 100 고정이라 지금은 안 드러나는 부채고, 이 파일이 소유한다. */
const LABEL_ROW = 44
/** 게이지 열 하나의 폭(px). */
const GAUGE_COL = 64
/** 치수선·게이지 색은 브랜드 색을 **이름으로** 찾는다(생 팔레트 금지). */
const GUIDE_COLOR_NAME = 'HD HERITAGE GREEN'
/** 면(밴드)의 투명도. 정본 도판의 연한 초록 띠. */
const BAND_OPACITY = 0.12

/**
 * 첫 렌더에는 전환을 끈다 — 마운트 순간 CSS 전환이 걸려 있으면 초기 상태가 흘러 들어온다.
 * 🔑 이 상태 전환이 만드는 리렌더는 기하가 같아 FLIP이 아무것도 하지 않는다.
 */
function useMotion() {
	const [on, setOn] = useState(false)
	useEffect(() => {
		if (!reducedMotion()) setOn(true)
	}, [])
	return on
}

/**
 * FLIP — 렌더 뒤 위치가 바뀐 노드만 역방향으로 밀었다 놓는다.
 *
 * 🔴 `getBoundingClientRect`가 아니라 `offsetLeft/Top`을 쓴다. 두 가지를 동시에 푼다:
 *    ① 렌더 사이 스크롤이 좌표에 섞이지 않는다 ② **전환 중에 또 전환해도** transform이 섞이지
 *    않는다(offset은 레이아웃 값이라 transform과 무관하다). 실측으로 겪은 함정이다.
 * 🔴 그래서 판(grid)이 `position: relative`여야 한다 — 모든 노드의 `offsetParent`가 그것으로 모인다.
 * 🔴 `size: false`인 노드는 translate만 잇는다 — 글자·심볼의 폭을 키프레임으로 건드리면
 *    `max-content` 트랙이 그 값을 다시 읽어 420ms 동안 트랙이 떤다(되먹임).
 * 🔑 첫 렌더에는 이전 위치가 없어 애니메이션이 돌지 않는다(깜빡임 없음).
 */
function useDiagramFlip() {
	const nodes = useRef(new Map<string, { node: HTMLElement; size: boolean }>())
	const previous = useRef(new Map<string, { x: number; y: number; w: number; h: number }>())

	useLayoutEffect(() => {
		const skip = reducedMotion()
		for (const [key, entry] of nodes.current) {
			const { node, size } = entry
			const now = {
				x: node.offsetLeft,
				y: node.offsetTop,
				w: node.offsetWidth,
				h: node.offsetHeight,
			}
			const before = previous.current.get(key)
			previous.current.set(key, now)
			if (!before || skip) continue
			const dx = before.x - now.x
			const dy = before.y - now.y
			const dw = before.w - now.w
			const dh = before.h - now.h
			const moved = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5
			const resized = size && (Math.abs(dw) > 0.5 || Math.abs(dh) > 0.5)
			if (!moved && !resized) continue
			// 전환 중 재전환: 앞선 것을 지우고 새 좌표로 다시 잇는다.
			for (const animation of node.getAnimations()) animation.cancel()
			node.animate(
				[
					{
						transform: `translate(${dx}px, ${dy}px)`,
						...(resized ? { width: `${before.w}px`, height: `${before.h}px` } : null),
					},
					{
						transform: 'none',
						...(resized ? { width: `${now.w}px`, height: `${now.h}px` } : null),
					},
				],
				{ duration: MORPH_MS, easing: MORPH_EASING },
			)
		}
	})

	/**
	 * 🔴 폰트가 늦게 오면(`font-display: block`) 글자 폭이 한 번 바뀌는데 React는 다시 렌더하지
	 *    않는다 → 기억한 위치가 낡는다. 그 시점에 다시 재서 맞춰 둔다(애니메이션은 돌리지 않는다).
	 */
	useLayoutEffect(() => {
		let alive = true
		document.fonts.ready.then(() => {
			if (!alive) return
			for (const [key, { node }] of nodes.current) {
				previous.current.set(key, {
					x: node.offsetLeft,
					y: node.offsetTop,
					w: node.offsetWidth,
					h: node.offsetHeight,
				})
			}
		})
		return () => {
			alive = false
		}
	}, [])

	return (key: string, size: boolean) => (node: HTMLDivElement | null) => {
		if (node) nodes.current.set(key, { node, size })
		else nodes.current.delete(key)
	}
}

/**
 * 덩어리 **자체**의 이동을 잇는다.
 *
 * 🔑 안쪽 FLIP(`useDiagramFlip`)은 판(grid)을 `offsetParent`로 삼아 재므로 **판 자신이 움직인 것을
 *    못 본다.** 그 사각지대가 꼴 전환에서 심볼이 딱 튀는 원인이었다 — 실측으로 심볼의 `offsetTop`은
 *    세 꼴 모두 44로 고정인데 화면 y는 110→102→55로 변했다. 도판 총높이가 188→205→298로 바뀌고
 *    판이 중앙 정렬하니 **상자째로** 올라간 것이다.
 * 🔴 기준이 달라 같은 이동을 두 번 세지 않는다 — 안쪽은 「덩어리 **안에서** 얼마나」, 바깥은
 *    「덩어리가 얼마나」. 둘의 transform이 합성되어 화면에서 보이는 총 이동이 정확히 이어진다.
 * 🔑 크기는 잇지 않는다(위치만). 사용자 규칙: 「텍스트가 딱 생기는 건 자연스럽고, 이 덩어리 **전체의
 *    위치**가 연속적이면 된다」(2026-08-19).
 */
function useBlockFlip() {
	const node = useRef<HTMLDivElement | null>(null)
	const previous = useRef<{ x: number; y: number } | null>(null)

	useLayoutEffect(() => {
		const element = node.current
		if (!element) return
		const now = { x: element.offsetLeft, y: element.offsetTop }
		const before = previous.current
		previous.current = now
		if (!before || reducedMotion()) return
		const dx = before.x - now.x
		const dy = before.y - now.y
		if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
		for (const animation of element.getAnimations()) animation.cancel()
		element.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
			duration: MORPH_MS,
			easing: MORPH_EASING,
		})
	})

	return node
}

const trackSize = (track: DiagramTrack, h: number) =>
	track.v === undefined ? 'max-content' : `${track.v * h}px`

type Placement = { column: [number, number]; row: [number, number] }
type Item = { placement: Placement; node: ReactNode; z: number; flow: boolean; size: boolean }

/** 스펙 하나를 grid 좌표로 푼다. 트랙 배열의 인덱스가 곧 grid line이라 좌표 실수가 구조적으로 안 난다. */
function resolve(spec: DiagramSpec, h: number) {
	const columns: string[] = []
	const colLine: Record<string, number> = {}
	for (let d = 0; d < spec.gaugeLeft; d++) columns.push(`${GAUGE_COL}px`)
	const leftGauge = (depth: number) => spec.gaugeLeft - depth
	for (const track of spec.cols) {
		if (track.id) colLine[track.id] = columns.length + 1
		columns.push(trackSize(track, h))
	}
	const rightGaugeStart = columns.length + 1
	for (let d = 0; d < spec.gaugeRight; d++) columns.push(`${GAUGE_COL}px`)
	const rightGauge = (depth: number) => rightGaugeStart + depth
	const lastColumn = columns.length + 1

	const rows: string[] = [`${LABEL_ROW}px`]
	const rowLine: Record<string, number> = {}
	for (const track of spec.rows) {
		if (track.id) rowLine[track.id] = rows.length + 1
		rows.push(trackSize(track, h))
	}
	const lastRow = rows.length + 1
	rows.push(`${LABEL_ROW}px`)

	const [envStart, envEnd] = spec.envRows
	const [areaStart, areaEnd] = spec.areaRows
	return {
		columns,
		rows,
		colLine,
		rowLine,
		leftGauge,
		rightGauge,
		lastColumn,
		lastRow,
		envTop: 2 + envStart,
		envBottom: 2 + envEnd + 1,
		areaTop: 2 + areaStart,
		areaBottom: 2 + areaEnd + 1,
	}
}

type Geometry = ReturnType<typeof resolve>

/* ── 주석 프리미티브 ─────────────────────────────────────────────────── */

/**
 * 간격의 경계 — 점선 세로선 한 쌍.
 * 🔑 **열 간격에만 그린다**(정본 도판). 행 간격은 면(Band) 사이로 읽히고 치수를 적지 않는다.
 *    간격 정체가 축별로 갈려 있으므로(`gapX`/`gapY`) 이 마크가 축을 넘나드는 일이 없다.
 */
function Tick({ guide }: { guide: string }) {
	return (
		<div
			className="size-full"
			style={{ borderLeft: `1px dashed ${guide}`, borderRight: `1px dashed ${guide}` }}
		/>
	)
}

/** 간격 값 라벨. 🔑 회전하지 않고 **옮겨 앉기만** 한다. knockout 배경은 판 색이다. */
function GapLabel({
	value,
	place,
	guide,
	stage,
}: {
	value: number
	place: 'above' | 'below'
	guide: string
	stage: string
}) {
	const align = place === 'below' ? 'items-start pt-2.5' : 'items-end pb-2.5'
	return (
		<span className={`relative grid size-full justify-center ${align}`}>
			{place === 'below' ? (
				<span
					className="absolute top-0 left-1/2 h-2.5"
					style={{ borderLeft: `1px dashed ${guide}` }}
				/>
			) : null}
			<span
				className="whitespace-nowrap px-1 font-body text-xs tabular-nums"
				style={{ color: guide, background: stage }}
			>
				{Number(value.toFixed(4))}H
			</span>
		</span>
	)
}

/** 치수 게이지 — 양끝 캡 달린 세로 실선 + 라벨. 🔴 안쪽 자식에는 FLIP을 걸지 않는다(offsetParent 함정). */
function Span({ label, side, guide }: { label: string; side: 'left' | 'right'; guide: string }) {
	const near = side === 'left' ? 'right' : 'left'
	return (
		<span className="relative grid size-full place-items-center">
			<span
				className="absolute top-0 bottom-0 w-px"
				style={{ background: guide, [near]: '13px' }}
			/>
			<span
				className="absolute top-0 h-px w-2.5"
				style={{ background: guide, [near]: '9px' }}
			/>
			<span
				className="absolute bottom-0 h-px w-2.5"
				style={{ background: guide, [near]: '9px' }}
			/>
			<span
				className="whitespace-nowrap font-body text-xs tabular-nums"
				style={{ color: guide, [side === 'left' ? 'marginRight' : 'marginLeft']: '22px' }}
			>
				{label}
			</span>
		</span>
	)
}

/**
 * 스펙 하나를 아이템 맵으로 만든다. 🔑 순수 함수라 **다른 꼴의 스펙에도 그대로 돌린다** —
 * 그래서 이 꼴에 없는 정체도 노드와 글자를 갖고 이음선으로 접히며 흐려진다(등장·퇴장이 대칭).
 */
function buildItems(
	spec: DiagramSpec,
	g: Geometry,
	ctx: {
		h: number
		guide: string
		stage: string
		motion: boolean
		symbol: ReactNode
		centered: boolean
	},
) {
	const items = new Map<string, Item>()
	const mark = (key: string, placement: Placement, node: ReactNode, z: number) =>
		items.set(key, { placement, node, z, flow: false, size: true })

	/* Band — 글자 행마다 전폭 */
	for (const track of spec.rows) {
		if (track.kind !== 'el' || !track.id) continue
		const line = g.rowLine[track.id] ?? 1
		mark(
			`band:${track.id}`,
			{ column: [1, g.lastColumn], row: [line, line + 1] },
			<div className="size-full" style={{ background: ctx.guide, opacity: BAND_OPACITY }} />,
			0,
		)
	}

	/* Rule — 봉투(심볼 위·아래) 실선 */
	for (const [key, line] of [
		['rule:env-top', g.envTop],
		['rule:env-bottom', g.envBottom],
	] as const) {
		mark(
			key,
			{ column: [1, g.lastColumn], row: [line, line + 1] },
			<div
				className="w-full self-start"
				style={{ borderTop: `1px solid ${ctx.guide}`, height: 0 }}
			/>,
			2,
		)
	}

	/* Tick + 라벨 — 🔑 **열 간격에만**. 행 간격은 치수를 적지 않는다(정본 도판).
	   🔴 파생이 낼 수 있는 모든 수치를 적으면 도판이 아니라 계측기가 된다(사용자 지정 2026-08-19). */
	for (const track of spec.cols) {
		if ((track.kind !== 'gap' && track.kind !== 'bar') || !track.id) continue
		const column = g.colLine[track.id] ?? 1
		mark(
			`tick:${track.id}`,
			{ column: [column, column + 1], row: [1, g.lastRow] },
			<Tick guide={ctx.guide} />,
			2,
		)
		const below = spec.labelBelow.includes(track.id)
		mark(
			`label:${track.id}`,
			{
				column: [column, column + 1],
				row: below ? [g.lastRow, g.lastRow + 1] : [1, 2],
			},
			<GapLabel
				value={track.labelValue ?? track.v ?? 0}
				place={below ? 'below' : 'above'}
				guide={ctx.guide}
				stage={ctx.stage}
			/>,
			3,
		)
	}

	/* 심볼 — 열이면 봉투 전체, 행이면 그 행 */
	{
		const column = g.colLine.sym
		const row = g.rowLine.sym
		const textColumn = g.colLine[spec.textCol] ?? 1
		const placement: Placement = column
			? { column: [column, column + 1], row: [g.envTop, g.envBottom] }
			: { column: [textColumn, textColumn + 1], row: [row, row + 1] }
		items.set('sym', {
			placement,
			node: <span className="grid size-full place-items-center">{ctx.symbol}</span>,
			z: 1,
			flow: true,
			size: false,
		})
	}

	/* 글자 — 🔑 규칙 하나. 행 트랙을 가리키면 그 행에, 없으면 영역 전체에 걸쳐 중앙에 놓인다. */
	for (const glyph of spec.glyphs) {
		const column = g.colLine[glyph.col] ?? g.colLine[spec.textCol] ?? 1
		const row = glyph.row ? g.rowLine[glyph.row] : undefined
		items.set(`text:${glyph.id}`, {
			placement: {
				column: [column, column + 1],
				row: row ? [row, row + 1] : [g.areaTop, g.areaBottom],
			},
			node: (
				<span
					className={`grid size-full items-center ${ctx.centered ? 'justify-center' : 'justify-start'}`}
				>
					<CapLine text={glyph.text} cap={glyph.cap} h={ctx.h} gapBefore={0} />
				</span>
			),
			z: 1,
			flow: true,
			size: false,
		})
	}

	/* 구분바 */
	for (const track of spec.cols) {
		if (track.kind !== 'bar' || !track.id) continue
		const column = g.colLine[track.id] ?? 1
		items.set(`bar:${track.id}`, {
			placement: { column: [column, column + 1], row: [g.areaTop, g.areaBottom] },
			node: <div className="size-full" style={{ background: ctx.guide }} />,
			z: 1,
			flow: true,
			size: true,
		})
	}

	/* Span(게이지) */
	for (const span of spec.spans) {
		const column = span.side === 'left' ? g.leftGauge(span.depth) : g.rightGauge(span.depth)
		const top = (span.from === 'env' ? g.envTop : g.rowLine[span.from]) ?? 1
		const bottom =
			(span.to === 'env' ? g.envBottom : g.rowLine[span.to] ? g.rowLine[span.to] + 1 : 0) ||
			top + 1
		mark(
			span.id,
			{ column: [column, column + 1], row: [top, bottom] },
			<Span label={span.label} side={span.side} guide={ctx.guide} />,
			3,
		)
	}

	return items
}

export function LockupDiagram({
	lockup,
	siblings,
	h,
	colors,
	stage,
	symbolT,
	symbolColors,
}: {
	lockup: Lockup
	/** 같은 계층의 다른 꼴들. 🔑 그 스펙까지 만들어 정체의 **합집합**을 마운트해 둔다. */
	siblings: Lockup[]
	h: number
	colors: Record<string, string>
	/** 판 색. 라벨의 knockout 배경으로 쓴다(테마 토큰이 아니라 판이 기준이다). */
	stage: string
	symbolT: number
	symbolColors: string[]
}) {
	const spec = useMemo(() => diagramSpec(lockup), [lockup])
	const g = useMemo(() => resolve(spec, h), [spec, h])
	const register = useDiagramFlip()
	const blockRef = useBlockFlip()
	const motion = useMotion()
	const guide = colors[GUIDE_COLOR_NAME] ?? 'currentColor'

	const items = useMemo(() => {
		const ctx = {
			h,
			guide,
			stage,
			motion,
			symbol: <SymbolMark h={h} t={symbolT} colors={symbolColors} marginTop={undefined} />,
			centered: lockup.orientation === 'vertical',
		}
		const merged = new Map<string, Item & { present: boolean }>()
		for (const [key, item] of buildItems(spec, g, ctx))
			merged.set(key, { ...item, present: true })
		/* 🔑 이 꼴에 없는 정체도 노드·글자를 갖는다 — 배치만 이 꼴 기준으로 푸니 자리를 못 찾는
		      것은 이음선으로 떨어지고, 사라질 때도 페이드아웃이 실제로 보인다. */
		for (const sibling of siblings) {
			if (sibling.key === lockup.key) continue
			for (const [key, item] of buildItems(diagramSpec(sibling), g, ctx)) {
				if (!merged.has(key)) merged.set(key, { ...item, present: false })
			}
		}
		return merged
	}, [spec, g, siblings, lockup, h, guide, stage, motion, symbolT, symbolColors])

	/* 🔴 순서를 고정한다 — 자리가 흔들리면 DOM이 재배열되어 같은 값을 잃는다.
	   🔴 「보이는 것」과 「숨은 것」을 두 배열로 나누면 안 된다. 같은 key라도 React는 다른 자식
	      슬롯으로 보고 언마운트→리마운트하며, 그러면 이동 전환이 죽는다(실측으로 잡았다). */
	const order = useMemo(() => [...items.keys()].sort(), [items])

	/** 🔑 없는 정체의 자리 — 「지워졌다」가 아니라 「글자 블록 속으로 접혔다」로 읽히게.
	 *  ponytail: 정체별 이음선 표가 더 정확하다(구분바는 `gap:branch:0`으로). 표 하나를 위해
	 *  데이터를 늘리지 않았고, 필요해지면 여기가 그 자리다. */
	const textColumn = g.colLine[spec.textCol] ?? 1
	const seam: Placement = {
		column: [textColumn, textColumn + 1],
		row: [g.areaTop, g.areaBottom],
	}

	return (
		<div className="w-full overflow-x-auto">
			{/* 🔑 덩어리는 판에 **수직·수평 중앙 정렬**된다(사용자 지정 2026-08-19). 정렬 때문에 생기는
				덩어리 자신의 이동은 `useBlockFlip`이 잇는다 — 그래서 심볼을 한 자리에 못 박지 않아도
				튀지 않고, 텍스트가 아무리 길어져도 정렬이 무너지지 않는다.
				🔴 `w-max mx-auto`여야 한다: 들어가면 가운데, 넘치면 마진이 0으로 접혀 왼쪽부터 보인다.
				   넘칠 때 가운데 정렬은 왼쪽을 잘라 먹는다. */}
			<div
				ref={blockRef}
				className="relative mx-auto grid w-max"
				style={{
					gridTemplateColumns: g.columns.join(' '),
					gridTemplateRows: g.rows.join(' '),
					alignItems: 'stretch',
				}}
			>
				{order.map((key) => {
					const item = items.get(key)
					if (!item) return null
					const placement = item.present ? item.placement : seam
					return (
						<div
							key={key}
							ref={register(key, item.size)}
							data-diagram={key}
							data-absent={item.present ? undefined : 'true'}
							aria-hidden={item.present ? undefined : true}
							className="pointer-events-none min-w-0"
							style={{
								gridColumn: `${placement.column[0]} / ${placement.column[1]}`,
								gridRow: `${placement.row[0]} / ${placement.row[1]}`,
								zIndex: item.z,
								opacity: item.present ? 1 : 0,
								transition: motion ? `opacity ${MORPH}` : undefined,
								/* 🔴 주석 마크는 흐름에서 뺀다 — `max-content` 트랙이 전폭 Band나 없는
								   정체의 글자 폭을 다시 읽어 트랙이 떠는 되먹임을 끊는다. 판을 만드는
								   것(심볼·글자·구분바)만 흐름에 남는다. */
								...(item.flow && item.present
									? null
									: { position: 'absolute' as const, inset: 0 }),
							}}
						>
							{item.node}
						</div>
					)
				})}
			</div>
		</div>
	)
}
