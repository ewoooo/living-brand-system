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

const trackSize = (track: DiagramTrack, h: number) =>
	track.v === undefined ? 'max-content' : `${track.v * h}px`

type Placement = { column: [number, number]; row: [number, number] }
type Axis = 'col' | 'row' | null
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

/**
 * 🔑 축 규칙 하나. 정체가 열 트랙을 가지면 「자기 열 × 판 전높이」, 행 트랙을 가지면
 *    「판 전폭 × 자기 행」이다. 그래서 축이 바뀌면 **같은 사각형이 재비율**되고, FLIP이
 *    그 변형을 이어 준다 — 회전이 아니다.
 */
function cross(g: Geometry, id: string): { axis: Axis; placement: Placement } {
	const column = g.colLine[id]
	if (column)
		return { axis: 'col', placement: { column: [column, column + 1], row: [1, g.lastRow] } }
	const row = g.rowLine[id]
	if (row) return { axis: 'row', placement: { column: [1, g.lastColumn], row: [row, row + 1] } }
	/* 🔴 이 꼴에 트랙이 없는 정체. **건너뛰지 않는다** — 건너뛰면 그 key가 배열에서 사라져
	   React가 언마운트하고, 돌아올 때 새로 만들어져 이동 전환이 죽는다(실측: childList 16건).
	   자리는 임의로 두고 호출부가 이음선으로 덮는다. */
	return { axis: null, placement: { column: [1, 2], row: [1, 2] } }
}

/* ── 주석 프리미티브 ─────────────────────────────────────────────────── */

/**
 * 간격의 경계. 🔑 **네 변을 항상 갖고 색만 바꾼다** — 열 간격이면 좌·우, 행 간격이면 상·하가
 * 점선이 된다. `border-color`는 보간되므로 축이 바뀌는 동안 크로스페이드하고, 상자 자체는
 * FLIP이 재비율한다. 회전을 쓰지 않는 이유: 1px 점선이 중간 각도에서 죽이 된다.
 */
function Tick({ axis, guide, motion }: { axis: Axis; guide: string; motion: boolean }) {
	const vertical = axis === 'col' ? guide : 'transparent'
	const horizontal = axis === 'row' ? guide : 'transparent'
	return (
		<div
			className="size-full"
			style={{
				borderStyle: 'dashed',
				borderWidth: 1,
				borderLeftColor: vertical,
				borderRightColor: vertical,
				borderTopColor: horizontal,
				borderBottomColor: horizontal,
				transition: motion ? `border-color ${MORPH}` : undefined,
			}}
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
	place: 'above' | 'below' | 'left'
	guide: string
	stage: string
}) {
	const align =
		place === 'below'
			? 'items-start pt-2.5'
			: place === 'above'
				? 'items-end pb-2.5'
				: 'items-center'
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

	/* Tick + 라벨 — 🔑 **두 축 모두** 그린다. 열 간격은 상단(좁으면 하단) 라벨, 행 간격은 좌측 라벨 열. */
	for (const track of [...spec.cols, ...spec.rows]) {
		if ((track.kind !== 'gap' && track.kind !== 'bar') || !track.id) continue
		const { axis, placement } = cross(g, track.id)
		mark(
			`tick:${track.id}`,
			placement,
			<Tick axis={axis} guide={ctx.guide} motion={ctx.motion} />,
			2,
		)
		const value = track.labelValue ?? track.v ?? 0
		if (axis !== 'row') {
			const column = g.colLine[track.id] ?? 1
			const below = spec.labelBelow.includes(track.id)
			mark(
				`label:${track.id}`,
				{
					column: [column, column + 1],
					row: below ? [g.lastRow, g.lastRow + 1] : [1, 2],
				},
				<GapLabel
					value={value}
					place={below ? 'below' : 'above'}
					guide={ctx.guide}
					stage={ctx.stage}
				/>,
				3,
			)
		} else {
			const row = g.rowLine[track.id]
			const column = g.leftGauge(2)
			mark(
				`label:${track.id}`,
				{ column: [column, column + 1], row: [row, row + 1] },
				<GapLabel value={value} place="left" guide={ctx.guide} stage={ctx.stage} />,
				3,
			)
		}
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
			{/* 🔑 **왼쪽 정렬이다.** 가운데 정렬하면 도판 폭이 꼴마다 달라(글자 열이 `max-content`)
				판 중심이 매번 다른 자리를 가리키고, 심볼이 꼴 전환마다 최대 325px 옆으로 튄다(실측).
				게이지 열 수가 상수이므로 왼쪽에 붙이면 **심볼이 세 꼴에서 같은 x에 선다** — 기준점이
				고정되니 나머지가 그 주위로 재배치되는 것으로 읽힌다. 정본 도판 3장도 좌측 정렬이다. */}
			<div
				className="relative grid w-max"
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
