'use client'

import { ChevronLeft, ChevronRight } from '@carbon/icons-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import Moveable from 'react-moveable'
import { TemplateRenderer } from '@/components/template-renderer'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { revokeBlob } from '@/lib/object-url'
import type { JsonTemplate } from '@/types/json-template'

/**
 * [POC] grid system 위에 순수 text/image 요소만 얹는 컴포저.
 * 캔버스(왼쪽)는 TemplateRenderer로 그리고 테두리 드래그·입력으로 크기 조절(가운데 정렬 유지),
 * 편집 컨트롤(오른쪽)은 캔버스 크기·요소 추가·그리드·선택 요소 편집을 담는다.
 * 그리드(행/열 정수 가중치) 변경 시 셀 좌표가 재계산되고 요소가 자동 리플로우된다.
 * 요소는 Moveable로 드래그하다 놓으면 커서가 있던 셀로 스냅. 좌상단 정렬 고정.
 */

const DEFAULT_CANVAS = 1080
const PREVIEW_WIDTH = 480
const MIN_CANVAS = 200
const MAX_CANVAS = 4000
const GUTTER = 12 // 캔버스 바깥 리사이즈 프레임 두께(px)
const DEFAULT_BG = '#f5f2e9' // 캔버스 배경 기본 단색

type Edge = 'left' | 'right' | 'top' | 'bottom' | 'nw' | 'ne' | 'sw' | 'se'

const clamp = (n: number) => Math.max(MIN_CANVAS, Math.min(MAX_CANVAS, Math.round(n)))
const GRAY =
	"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23cbcbcb'/></svg>"

function trackSizes(weights: number[], total: number, gap = 0) {
	const sum = weights.reduce((a, b) => a + b, 0) || 1
	const available = Math.max(0, total - gap * (weights.length - 1))
	return weights.map((w) => (available * w) / sum)
}
function offsetAt(sizes: number[], i: number, gap = 0) {
	return sizes.slice(0, i).reduce((a, b) => a + b, 0) + gap * i
}
// 좌표가 속한 트랙 index. 각 셀 뒤의 gap은 앞 셀의 드롭 영역으로 친다.
function trackAt(sizes: number[], pos: number, gap = 0) {
	let acc = 0
	for (let i = 0; i < sizes.length; i++) {
		acc += sizes[i] + gap
		if (pos < acc) return i
	}
	return sizes.length - 1
}

type HAlign = 'left' | 'center' | 'right'
type VAlign = 'top' | 'middle' | 'bottom'
// 텍스트 수평 흐름: fixed(폭고정·줄바꿈), auto-width(줄바꿈없이 폭따라감), truncate(넘치면 …).
type TextFlow = 'fixed' | 'auto-width' | 'truncate'

/** 셀 안 텍스트 아이템 — 내용 + 정렬(수평/수직) + 흐름 + 폰트(크기·굵기·줄간격·색). */
interface TextItem {
	content: string
	hAlign: HAlign
	vAlign: VAlign
	flow: TextFlow
	fontSize: number
	fontWeight: string
	lineHeight: number
	color: string
}

/**
 * 셀 안 이미지 아이템 — 크기는 셀과 무관한 자체 width/height(px).
 * offsetX/offsetY는 셀 좌상단 기준 위치 보정(px) — 8방향 리사이즈로 좌/상단을 당길 때 앵커가 이동한다.
 */
interface ImageItem {
	src: string
	width: number
	height: number
	offsetX: number
	offsetY: number
}

/** 셀 하나에 텍스트 1·이미지 1이 들어갈 수 있다(z-index는 나중). null이면 비어 있음. */
interface Cell {
	text: TextItem | null
	image: ImageItem | null
}
type ItemKind = 'text' | 'image'

/** 현재 선택된 셀 아이템 — 편집 패널이 참조한다. */
interface Selected {
	id: string
	index: number
	kind: ItemKind
	text: TextItem | null
	image: ImageItem | null
}

const emptyCell = (): Cell => ({ text: null, image: null })
const defaultText = (content: string): TextItem => ({
	content,
	hAlign: 'left',
	vAlign: 'top',
	flow: 'fixed',
	fontSize: 40,
	fontWeight: '400',
	lineHeight: 1.4,
	color: '#1f2a24',
})

/** 폰트 굵기 프리셋 — 임시 UI(Figma 확정 후 교체). value는 CSS font-weight 문자열. */
const FONT_WEIGHT: { value: string; label: string }[] = [
	{ value: '400', label: '보통' },
	{ value: '500', label: '중간' },
	{ value: '700', label: '굵게' },
]

const H_ALIGN: { value: HAlign; label: string }[] = [
	{ value: 'left', label: '왼쪽' },
	{ value: 'center', label: '가운데' },
	{ value: 'right', label: '오른쪽' },
]
const V_ALIGN: { value: VAlign; label: string }[] = [
	{ value: 'top', label: '위' },
	{ value: 'middle', label: '가운데' },
	{ value: 'bottom', label: '아래' },
]
const TEXT_FLOW: { value: TextFlow; label: string }[] = [
	{ value: 'fixed', label: '고정' },
	{ value: 'auto-width', label: '흘리기' },
	{ value: 'truncate', label: '자르기' },
]

/** 셀 리스트에서 아이템 식별자 "<index>:<kind>" 파싱. */
function parseItemId(id: string): { index: number; kind: ItemKind } {
	const [i, kind] = id.split(':')
	return { index: Number(i), kind: kind as ItemKind }
}

/** 템플릿(source)에서 캔버스·그리드·요소 초기 상태를 복원한다. grid 없으면 기본값. */
function deriveInitial(source?: JsonTemplate) {
	const canvasW = source?.width ?? DEFAULT_CANVAS
	const canvasH = source?.height ?? DEFAULT_CANVAS
	const bgColor = source?.background ?? DEFAULT_BG
	const padX = source?.padding?.x ?? 0
	const padY = source?.padding?.y ?? 0
	const rows = source?.grid?.rows ?? [1, 2, 1]
	const cols = source?.grid?.columns ?? [2, 1, 1]
	const gap = source?.grid?.gap ?? 0
	const cells: Cell[] = Array.from({ length: rows.length * cols.length }, emptyCell)

	if (source?.grid) {
		const colSizes = trackSizes(cols, Math.max(1, canvasW - padX * 2), gap)
		const rowSizes = trackSizes(rows, Math.max(1, canvasH - padY * 2), gap)
		for (const el of source.elements) {
			if (el.type !== 'text' && el.type !== 'image') continue
			const row = trackAt(rowSizes, el.y - padY, gap)
			const col = trackAt(colSizes, el.x - padX, gap)
			const cell = cells[row * cols.length + col]
			if (el.type === 'text') {
				cell.text = {
					content: el.text,
					hAlign: el.textAlign,
					vAlign: el.verticalAlign,
					flow: el.textFit,
					fontSize: el.fontSize,
					fontWeight: el.fontWeight,
					lineHeight: el.lineHeight,
					color: el.color,
				}
			} else {
				// 로드 시 이미지는 셀 좌상단으로 스냅(offset 0) — 저장된 x/y가 셀 기준값이라 무보정.
				cell.image = {
					src: el.src,
					width: el.width,
					height: el.height,
					offsetX: 0,
					offsetY: 0,
				}
			}
		}
	}

	// 배경 이미지는 로드 시 구분하지 않는다(POC) — 저장된 이미지는 셀로 라우팅된다.
	return { canvasW, canvasH, bgColor, bgImage: null, padX, padY, gap, rows, cols, cells }
}

/**
 * 캔버스 크기 상태 + 테두리 드래그 리사이즈를 소유한다.
 * 포인터 캡처로 이벤트를 독점하고, 시작값 기준 절대 delta를 rAF로 프레임당 1회만 반영해 떨림을 막는다.
 */
function useCanvasResize(initialW: number, initialH: number, scale: number) {
	const [canvasW, setCanvasW] = useState(initialW)
	const [canvasH, setCanvasH] = useState(initialH)
	const [resizing, setResizing] = useState<Edge | null>(null)
	const rafRef = useRef<number | null>(null)
	const pendingRef = useRef<{ w: number; h: number } | null>(null)

	function startResize(edge: Edge, event: React.PointerEvent<HTMLElement>) {
		event.preventDefault()
		const handle = event.currentTarget
		handle.setPointerCapture(event.pointerId)
		const startX = event.clientX
		const startY = event.clientY
		const startW = canvasW
		const startH = canvasH
		document.body.style.userSelect = 'none'
		setResizing(edge)

		const flush = () => {
			rafRef.current = null
			if (pendingRef.current) {
				setCanvasW(pendingRef.current.w)
				setCanvasH(pendingRef.current.h)
			}
		}
		const growsRight = edge === 'right' || edge === 'ne' || edge === 'se'
		const growsLeft = edge === 'left' || edge === 'nw' || edge === 'sw'
		const growsDown = edge === 'bottom' || edge === 'se' || edge === 'sw'
		const growsUp = edge === 'top' || edge === 'ne' || edge === 'nw'
		const onMove = (ev: PointerEvent) => {
			const dx = (ev.clientX - startX) / scale
			const dy = (ev.clientY - startY) / scale
			pendingRef.current = {
				w: clamp(growsRight ? startW + dx : growsLeft ? startW - dx : startW),
				h: clamp(growsDown ? startH + dy : growsUp ? startH - dy : startH),
			}
			// 프레임당 1회만 상태 갱신 — pointermove 폭주로 인한 리렌더 떨림 차단.
			if (rafRef.current == null) rafRef.current = requestAnimationFrame(flush)
		}
		const onUp = () => {
			handle.releasePointerCapture(event.pointerId)
			handle.removeEventListener('pointermove', onMove)
			handle.removeEventListener('pointerup', onUp)
			document.body.style.userSelect = ''
			if (rafRef.current != null) {
				cancelAnimationFrame(rafRef.current)
				rafRef.current = null
			}
			flush()
			pendingRef.current = null
			setResizing(null)
		}
		handle.addEventListener('pointermove', onMove)
		handle.addEventListener('pointerup', onUp)
	}

	return { canvasW, canvasH, setCanvasW, setCanvasH, resizing, startResize }
}

export function GridComposer({ source }: { source?: JsonTemplate }) {
	const initial = useMemo(() => deriveInitial(source), [source])
	// 표시 배율은 마운트 시 고정 — 캔버스 크기를 바꾸면 표시 크기가 실제로 변한다.
	const scale = PREVIEW_WIDTH / initial.canvasW
	const { canvasW, canvasH, setCanvasW, setCanvasH, resizing, startResize } = useCanvasResize(
		initial.canvasW,
		initial.canvasH,
		scale,
	)

	const [padX, setPadX] = useState(initial.padX)
	const [padY, setPadY] = useState(initial.padY)
	const [gap, setGap] = useState(initial.gap)
	// 배경 = 캔버스 전체 크기(gap·여백 무시)의 별도 레이어. 단색 fill + 선택적 이미지(z 0).
	const [bgColor, setBgColor] = useState(initial.bgColor)
	const [bgImage, setBgImage] = useState<string | null>(initial.bgImage)
	const [rows, setRows] = useState<number[]>(initial.rows)
	const [cols, setCols] = useState<number[]>(initial.cols)
	const [cells, setCells] = useState<Cell[]>(initial.cells)
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [dragFree, setDragFree] = useState<{ id: string; x: number; y: number } | null>(null)
	const [dropCell, setDropCell] = useState<{ row: number; col: number } | null>(null)
	const [moveableTarget, setMoveableTarget] = useState<HTMLElement | null>(null)
	const [hideGuides, setHideGuides] = useState(false)
	const canvasRef = useRef<HTMLDivElement>(null)

	// 그리드는 캔버스 안쪽 여백(padX·padY) 영역에 배치된다.
	const innerW = Math.max(1, canvasW - padX * 2)
	const innerH = Math.max(1, canvasH - padY * 2)
	const rowSizes = useMemo(() => trackSizes(rows, innerH, gap), [rows, innerH, gap])
	const colSizes = useMemo(() => trackSizes(cols, innerW, gap), [cols, innerW, gap])

	function cellBox(row: number, col: number) {
		const r = Math.min(row, rowSizes.length - 1)
		const c = Math.min(col, colSizes.length - 1)
		return {
			x: padX + offsetAt(colSizes, c, gap),
			y: padY + offsetAt(rowSizes, r, gap),
			width: colSizes[c],
			height: rowSizes[r],
		}
	}

	/** 해당 kind가 비어 있는 첫 셀에 아이템을 넣고 선택한다. 이미지 기본 크기 = 그 셀 크기. */
	function addItem(kind: ItemKind) {
		const index = cells.findIndex((cell) => cell[kind] == null)
		const target = index === -1 ? 0 : index
		const box = cellBox(Math.floor(target / cols.length), target % cols.length)
		const value =
			kind === 'text'
				? defaultText('텍스트')
				: ({
						src: GRAY,
						width: box.width,
						height: box.height,
						offsetX: 0,
						offsetY: 0,
					} satisfies ImageItem)
		setCells((prev) =>
			prev.map((cell, i) => (i === target ? { ...cell, [kind]: value } : cell)),
		)
		setSelectedId(`${target}:${kind}`)
	}

	/** 텍스트 아이템 부분 수정(내용·정렬·흐름). */
	function patchText(index: number, patch: Partial<TextItem>) {
		setCells((prev) =>
			prev.map((cell, i) =>
				i === index && cell.text ? { ...cell, text: { ...cell.text, ...patch } } : cell,
			),
		)
	}
	/** 이미지 아이템 부분 수정(src·크기). */
	function patchImage(index: number, patch: Partial<ImageItem>) {
		setCells((prev) =>
			prev.map((cell, i) =>
				i === index && cell.image ? { ...cell, image: { ...cell.image, ...patch } } : cell,
			),
		)
	}
	function removeItem(index: number, kind: ItemKind) {
		setCells((prev) => prev.map((cell, i) => (i === index ? { ...cell, [kind]: null } : cell)))
		setSelectedId(null)
	}
	/** 아이템을 다른 셀로 이동 — 대상 셀의 같은 kind를 덮어쓰고 원본을 비운다. */
	function moveItem(index: number, kind: ItemKind, targetIndex: number) {
		if (targetIndex === index) return
		setCells((prev) => {
			const value = prev[index][kind]
			return prev.map((cell, i) => {
				if (i === index) return { ...cell, [kind]: null }
				if (i === targetIndex) return { ...cell, [kind]: value }
				return cell
			})
		})
	}

	function setWeight(axis: 'row' | 'col', index: number, value: number) {
		const clamped = Number.isFinite(value) && value > 0 ? Math.round(value) : 1
		;(axis === 'row' ? setRows : setCols)((prev) =>
			prev.map((w, i) => (i === index ? clamped : w)),
		)
	}
	// 행/열 추가·삭제 시 cells(w*h flat)를 리맵해 기존 셀 내용을 (row,col) 기준으로 보존한다.
	const w = cols.length
	const h = rows.length
	// 키보드 재배치: 선택 요소를 화살표로 인접 셀에 옮긴다(포인터 드래그의 셀 스냅과 동일 동작).
	function moveSelectedByArrow(index: number, kind: ItemKind, key: string) {
		const col = index % w
		const row = Math.floor(index / w)
		let target = index
		if (key === 'ArrowLeft' && col > 0) target = index - 1
		else if (key === 'ArrowRight' && col < w - 1) target = index + 1
		else if (key === 'ArrowUp' && row > 0) target = index - w
		else if (key === 'ArrowDown' && row < h - 1) target = index + w
		else return
		moveItem(index, kind, target)
		setSelectedId(`${target}:${kind}`)
	}
	function addTrack(axis: 'row' | 'col') {
		if (axis === 'row') {
			setRows((prev) => [...prev, 1])
			setCells((prev) => [...prev, ...Array.from({ length: w }, emptyCell)])
		} else {
			setCols((prev) => [...prev, 1])
			setCells((prev) => {
				const next: Cell[] = []
				for (let r = 0; r < h; r++) {
					for (let c = 0; c < w; c++) next.push(prev[r * w + c])
					next.push(emptyCell())
				}
				return next
			})
		}
	}
	function removeTrack(axis: 'row' | 'col', index: number) {
		if (axis === 'row') {
			if (h <= 1) return
			setRows((prev) => prev.filter((_, i) => i !== index))
			setCells((prev) => prev.filter((_, i) => Math.floor(i / w) !== index))
		} else {
			if (w <= 1) return
			setCols((prev) => prev.filter((_, i) => i !== index))
			setCells((prev) => prev.filter((_, i) => i % w !== index))
		}
	}

	const template = useMemo<JsonTemplate>(() => {
		const width = cols.length
		const cellEls = cells.flatMap((cell, index) => {
			// cellBox 인라인 — memo가 rowSizes·colSizes·padX·padY를 직접 의존하게 한다.
			const r = Math.min(Math.floor(index / width), rowSizes.length - 1)
			const c = Math.min(index % width, colSizes.length - 1)
			const base = {
				x: padX + offsetAt(colSizes, c, gap),
				y: padY + offsetAt(rowSizes, r, gap),
				width: colSizes[c],
				height: rowSizes[r],
			}
			const boxOf = (kind: ItemKind) =>
				dragFree?.id === `${index}:${kind}`
					? { ...base, x: dragFree.x, y: dragFree.y }
					: base
			const out: JsonTemplate['elements'] = []
			// 이미지가 아래(z 1), 텍스트가 위(z 2) — z-index 정교화는 나중.
			if (cell.image != null) {
				// 이미지는 셀 좌상단 + offset에 놓이되 크기는 자체 width/height(셀과 무관).
				// 자유 드래그 중(boxOf가 절대좌표 반환)에는 offset을 더하지 않는다.
				const anchor = boxOf('image')
				const free = dragFree?.id === `${index}:image`
				out.push({
					id: `${index}:image`,
					type: 'image',
					x: free ? anchor.x : anchor.x + cell.image.offsetX,
					y: free ? anchor.y : anchor.y + cell.image.offsetY,
					width: cell.image.width,
					height: cell.image.height,
					zIndex: 1,
					locked: false,
					assetCollection: 'template-assets',
					assetId: 0,
					src: cell.image.src,
					objectFit: 'cover',
					borderRadius: 0,
				})
			}
			if (cell.text != null) {
				const box = boxOf('text')
				out.push({
					id: `${index}:text`,
					type: 'text',
					...box,
					zIndex: 2,
					locked: false,
					text: cell.text.content,
					fontSize: cell.text.fontSize,
					fontFamily: 'Pretendard, sans-serif',
					fontWeight: cell.text.fontWeight,
					color: cell.text.color,
					lineHeight: cell.text.lineHeight,
					letterSpacing: 0,
					textAlign: cell.text.hAlign,
					textFit: cell.text.flow,
					verticalAlign: cell.text.vAlign,
					inputFormat: 'free',
				})
			}
			return out
		})
		// 배경 이미지는 캔버스 전체(x0/y0, gap·여백 무시)를 채우고 가장 아래(z 0)에 깔린다.
		const bgEls: JsonTemplate['elements'] = bgImage
			? [
					{
						id: 'bg:image',
						type: 'image',
						x: 0,
						y: 0,
						width: canvasW,
						height: canvasH,
						zIndex: 0,
						locked: false,
						assetCollection: 'template-assets',
						assetId: 0,
						src: bgImage,
						objectFit: 'cover',
						borderRadius: 0,
					},
				]
			: []
		return {
			width: canvasW,
			height: canvasH,
			background: bgColor,
			elements: [...bgEls, ...cellEls],
		}
	}, [
		cells,
		dragFree,
		rowSizes,
		colSizes,
		canvasW,
		canvasH,
		padX,
		padY,
		gap,
		cols.length,
		bgColor,
		bgImage,
	])

	const selected = (() => {
		if (!selectedId) return null
		const { index, kind } = parseItemId(selectedId)
		const cell = cells[index]
		if (!cell || cell[kind] == null) return null
		return { id: selectedId, index, kind, text: cell.text, image: cell.image }
	})()

	return (
		<section className="flex w-full gap-8">
			{/* ── 캔버스 (왼쪽, 가운데 정렬) ── */}
			<div className="flex flex-1 justify-center overflow-auto">
				{/* 캔버스는 독립적으로 존재하고, 리사이즈 프레임은 바깥 gutter에만 놓여 내부를 침범하지 않는다. */}
				<div
					className="relative shrink-0"
					style={{
						width: canvasW * scale + GUTTER * 2,
						height: canvasH * scale + GUTTER * 2,
					}}
				>
					<div
						ref={canvasRef}
						className="absolute top-3 left-3 overflow-hidden border border-border"
						style={{ width: canvasW * scale, height: canvasH * scale }}
					>
						<TemplateRenderer template={template} scale={scale} />

						{/* 안내선 — n개 트랙이면 내부 경계 n-1개(외곽선 제외). 가이드라 클릭 통과. */}
						{!hideGuides && (
							<>
								{rowSizes.slice(1).map((_, i) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: 경계는 위치가 곧 정체성
										key={`h-${i}`}
										className="pointer-events-none absolute bg-foreground-muted/30"
										style={{
											left: padX * scale,
											top:
												(padY + offsetAt(rowSizes, i + 1, gap) - gap / 2) *
												scale,
											width: innerW * scale,
											height: 1,
											zIndex: 4,
										}}
									/>
								))}
								{colSizes.slice(1).map((_, j) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: 경계는 위치가 곧 정체성
										key={`v-${j}`}
										className="pointer-events-none absolute bg-foreground-muted/30"
										style={{
											left:
												(padX + offsetAt(colSizes, j + 1, gap) - gap / 2) *
												scale,
											top: padY * scale,
											width: 1,
											height: innerH * scale,
											zIndex: 4,
										}}
									/>
								))}
							</>
						)}

						{dragFree &&
							dropCell &&
							(() => {
								const box = cellBox(dropCell.row, dropCell.col)
								return (
									<div
										className="pointer-events-none absolute border-2 border-primary bg-primary/25"
										style={{
											left: box.x * scale,
											top: box.y * scale,
											width: box.width * scale,
											height: box.height * scale,
											zIndex: 5,
										}}
									/>
								)
							})()}

						{cells.flatMap((cell, index) => {
							const base = cellBox(
								Math.floor(index / cols.length),
								index % cols.length,
							)
							return (['image', 'text'] as const).flatMap((kind) => {
								if (cell[kind] == null) return []
								const id = `${index}:${kind}`
								const isSelected = id === selectedId
								// 이미지는 셀 크기와 무관한 자체 width/height + offset을 hit-area로.
								const sized =
									kind === 'image' && cell.image
										? {
												x: base.x + cell.image.offsetX,
												y: base.y + cell.image.offsetY,
												width: cell.image.width,
												height: cell.image.height,
											}
										: base
								const box =
									dragFree?.id === id
										? { ...sized, x: dragFree.x, y: dragFree.y }
										: sized
								return [
									<button
										type="button"
										key={id}
										ref={isSelected ? setMoveableTarget : undefined}
										onClick={() => setSelectedId(isSelected ? null : id)}
										onKeyDown={(e) => {
											if (!isSelected || !e.key.startsWith('Arrow')) return
											e.preventDefault()
											moveSelectedByArrow(index, kind, e.key)
										}}
										className={`absolute cursor-move p-0 ${isSelected ? 'ring-2 ring-primary' : ''}`}
										style={{
											left: box.x * scale,
											top: box.y * scale,
											width: box.width * scale,
											height: box.height * scale,
											background: 'transparent',
											touchAction: 'none',
											// 텍스트 클릭 타깃이 이미지보다 위 — z-index 정교화는 나중.
											zIndex: kind === 'text' ? 4 : 3,
										}}
										aria-label={`${kind} 요소`}
									/>,
								]
							})
						})}

						{selected && moveableTarget && (
							<Moveable
								flushSync={flushSync}
								target={moveableTarget}
								draggable
								resizable={selected.kind === 'image'}
								keepRatio={false}
								origin={false}
								renderDirections={
									selected.kind === 'image'
										? ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']
										: []
								}
								onResize={(event) => {
									if (selected.kind !== 'image') return
									// 좌/상단 핸들(direction -1)은 크기 증가분만큼 앵커를 당긴다.
									// offset을 width 변화와 같은 절대값에서 유도해 event.delta 의존을 없앤다.
									const [dirX, dirY] = event.direction
									setCells((prev) =>
										prev.map((cell, i) => {
											if (i !== selected.index || !cell.image) return cell
											const newW = Math.max(
												8,
												Math.round(event.width / scale),
											)
											const newH = Math.max(
												8,
												Math.round(event.height / scale),
											)
											return {
												...cell,
												image: {
													...cell.image,
													width: newW,
													height: newH,
													offsetX:
														dirX < 0
															? cell.image.offsetX -
																(newW - cell.image.width)
															: cell.image.offsetX,
													offsetY:
														dirY < 0
															? cell.image.offsetY -
																(newH - cell.image.height)
															: cell.image.offsetY,
												},
											}
										}),
									)
								}}
								onDrag={(event) => {
									setDragFree({
										id: selected.id,
										x: event.left / scale,
										y: event.top / scale,
									})
									const rect = canvasRef.current?.getBoundingClientRect()
									if (rect) {
										const px = (event.clientX - rect.left) / scale - padX
										const py = (event.clientY - rect.top) / scale - padY
										setDropCell({
											row: trackAt(rowSizes, py, gap),
											col: trackAt(colSizes, px, gap),
										})
									}
								}}
								onDragEnd={() => {
									if (dropCell) {
										const targetIndex =
											dropCell.row * cols.length + dropCell.col
										moveItem(selected.index, selected.kind, targetIndex)
									}
									setDragFree(null)
									setDropCell(null)
								}}
							/>
						)}
					</div>

					{/* 리사이즈 프레임 — 캔버스 바깥 gutter의 8방향(변 4 + 꼭짓점 4). 진한 회색, hover/active에 흰색 반투명. */}
					{RESIZE_EDGES.map((edge) => (
						<ResizeHandle
							key={edge}
							edge={edge}
							active={resizing === edge}
							onStart={startResize}
						/>
					))}
				</div>
			</div>

			{/* ── 편집 패널 (오른쪽) ── */}
			<CompositionPanel
				canvasW={canvasW}
				canvasH={canvasH}
				setCanvasW={setCanvasW}
				setCanvasH={setCanvasH}
				padX={padX}
				padY={padY}
				setPadX={setPadX}
				setPadY={setPadY}
				gap={gap}
				setGap={setGap}
				bgColor={bgColor}
				setBgColor={setBgColor}
				bgImage={bgImage}
				setBgImage={setBgImage}
				addItem={addItem}
				hideGuides={hideGuides}
				setHideGuides={setHideGuides}
				rows={rows}
				cols={cols}
				setWeight={setWeight}
				addTrack={addTrack}
				removeTrack={removeTrack}
				selected={selected}
				patchText={patchText}
				patchImage={patchImage}
				removeItem={removeItem}
				onCloseSelected={() => setSelectedId(null)}
			/>
		</section>
	)
}

interface CompositionPanelProps {
	canvasW: number
	canvasH: number
	setCanvasW: (value: number) => void
	setCanvasH: (value: number) => void
	padX: number
	padY: number
	setPadX: (value: number) => void
	setPadY: (value: number) => void
	gap: number
	setGap: (value: number) => void
	bgColor: string
	setBgColor: (value: string) => void
	bgImage: string | null
	setBgImage: (value: string | null) => void
	addItem: (kind: ItemKind) => void
	hideGuides: boolean
	setHideGuides: (value: boolean) => void
	rows: number[]
	cols: number[]
	setWeight: (axis: 'row' | 'col', index: number, value: number) => void
	addTrack: (axis: 'row' | 'col') => void
	removeTrack: (axis: 'row' | 'col', index: number) => void
	selected: Selected | null
	patchText: (index: number, patch: Partial<TextItem>) => void
	patchImage: (index: number, patch: Partial<ImageItem>) => void
	removeItem: (index: number, kind: ItemKind) => void
	onCloseSelected: () => void
}

/** 편집 컨트롤(오른쪽) — 캔버스 크기·여백·배경·요소 추가·그리드·선택 요소 편집. 상태는 GridComposer가 소유한다. */
function CompositionPanel({
	canvasW,
	canvasH,
	setCanvasW,
	setCanvasH,
	padX,
	padY,
	setPadX,
	setPadY,
	gap,
	setGap,
	bgColor,
	setBgColor,
	bgImage,
	setBgImage,
	addItem,
	hideGuides,
	setHideGuides,
	rows,
	cols,
	setWeight,
	addTrack,
	removeTrack,
	selected,
	patchText,
	patchImage,
	removeItem,
	onCloseSelected,
}: CompositionPanelProps) {
	return (
		<aside className="flex w-64 shrink-0 flex-col gap-4">
			<Field label="캔버스 크기">
				<div className="flex gap-2">
					<SizeInput label="폭" value={canvasW} onCommit={setCanvasW} />
					<SizeInput label="높이" value={canvasH} onCommit={setCanvasH} />
				</div>
			</Field>

			<Field label="여백 (Padding)">
				<div className="flex gap-2">
					<SizeInput
						label="가로"
						value={padX}
						min={0}
						onCommit={(v) => setPadX(Math.min(v, Math.floor(canvasW / 2) - 1))}
					/>
					<SizeInput
						label="세로"
						value={padY}
						min={0}
						onCommit={(v) => setPadY(Math.min(v, Math.floor(canvasH / 2) - 1))}
					/>
				</div>
			</Field>

			<Field label="셀 간격 (Gap)">
				<SizeInput label="px" value={gap} min={0} onCommit={setGap} />
			</Field>

			<Field label="배경 (캔버스 전체)">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<ColorField value={bgColor} onChange={setBgColor} label="배경 색" />
					</div>
					<Input
						type="file"
						accept="image/*"
						aria-label="배경 이미지"
						onChange={(e) => {
							const file = e.target.files?.[0]
							if (!file) return
							revokeBlob(bgImage)
							setBgImage(URL.createObjectURL(file))
						}}
					/>
					{bgImage && (
						<Button
							size="sm"
							variant="ghost"
							className="self-start text-destructive"
							onClick={() => {
								revokeBlob(bgImage)
								setBgImage(null)
							}}
						>
							배경 이미지 제거
						</Button>
					)}
				</div>
			</Field>

			<Separator />

			<div className="flex gap-2">
				<Button size="sm" className="flex-1" onClick={() => addItem('text')}>
					+ 텍스트
				</Button>
				<Button
					size="sm"
					variant="secondary"
					className="flex-1"
					onClick={() => addItem('image')}
				>
					+ 이미지
				</Button>
			</div>

			<Separator />

			<label
				htmlFor="hide-guides"
				className="type-callout flex cursor-pointer items-center gap-2"
			>
				<Checkbox
					id="hide-guides"
					checked={hideGuides}
					onCheckedChange={(v) => setHideGuides(v === true)}
				/>
				안내선 숨기기
			</label>

			<TrackList
				title="행 (Rows)"
				weights={rows}
				onCommit={(i, v) => setWeight('row', i, v)}
				onAdd={() => addTrack('row')}
				onRemove={(i) => removeTrack('row', i)}
			/>
			<TrackList
				title="열 (Columns)"
				weights={cols}
				onCommit={(i, v) => setWeight('col', i, v)}
				onAdd={() => addTrack('col')}
				onRemove={(i) => removeTrack('col', i)}
			/>

			{selected && (
				<>
					<Separator />
					<SelectedItemEditor
						selected={selected}
						patchText={patchText}
						patchImage={patchImage}
						removeItem={removeItem}
						onClose={onCloseSelected}
					/>
				</>
			)}
		</aside>
	)
}

/** 선택한 텍스트/이미지 아이템 편집기 — 패널 하단에 접혀 나온다. */
function SelectedItemEditor({
	selected,
	patchText,
	patchImage,
	removeItem,
	onClose,
}: {
	selected: Selected
	patchText: (index: number, patch: Partial<TextItem>) => void
	patchImage: (index: number, patch: Partial<ImageItem>) => void
	removeItem: (index: number, kind: ItemKind) => void
	onClose: () => void
}) {
	return (
		<Field label={`선택한 ${selected.kind === 'text' ? '텍스트' : '이미지'}`}>
			{selected.kind === 'text' && selected.text ? (
				<div className="flex flex-col gap-2">
					<Textarea
						rows={2}
						value={selected.text.content}
						onChange={(e) => patchText(selected.index, { content: e.target.value })}
					/>
					<AlignPicker
						label="수평"
						value={selected.text.hAlign}
						options={H_ALIGN}
						onChange={(hAlign) => patchText(selected.index, { hAlign })}
					/>
					<AlignPicker
						label="수직"
						value={selected.text.vAlign}
						options={V_ALIGN}
						onChange={(vAlign) => patchText(selected.index, { vAlign })}
					/>
					<AlignPicker
						label="흐름"
						value={selected.text.flow}
						options={TEXT_FLOW}
						onChange={(flow) => patchText(selected.index, { flow })}
					/>
					<AlignPicker
						label="굵기"
						value={selected.text.fontWeight}
						options={FONT_WEIGHT}
						onChange={(fontWeight) => patchText(selected.index, { fontWeight })}
					/>
					<div className="flex gap-2">
						<SizeInput
							label="크기 (px)"
							value={selected.text.fontSize}
							min={1}
							onCommit={(v) => patchText(selected.index, { fontSize: v })}
						/>
						<SizeInput
							label="줄간격 (배수)"
							value={selected.text.lineHeight}
							min={0.1}
							float
							onCommit={(v) => patchText(selected.index, { lineHeight: v })}
						/>
					</div>
					<div className="flex items-center gap-2">
						<span className="type-caption-1 w-8 shrink-0 text-foreground-muted">
							색상
						</span>
						<ColorField
							value={selected.text.color}
							onChange={(color) => patchText(selected.index, { color })}
							label="텍스트 색"
						/>
					</div>
				</div>
			) : selected.image ? (
				<div className="flex flex-col gap-2">
					<Input
						type="file"
						accept="image/*"
						onChange={(e) => {
							const file = e.target.files?.[0]
							if (!file) return
							revokeBlob(selected.image?.src)
							patchImage(selected.index, {
								src: URL.createObjectURL(file),
							})
						}}
					/>
					{/* 셀 크기와 무관한 임의 크기 — 입력 또는 캔버스의 se 핸들 드래그로 조절 */}
					<div className="flex gap-2">
						<SizeInput
							label="너비"
							value={selected.image.width}
							min={8}
							onCommit={(v) => patchImage(selected.index, { width: v })}
						/>
						<SizeInput
							label="높이"
							value={selected.image.height}
							min={8}
							onCommit={(v) => patchImage(selected.index, { height: v })}
						/>
					</div>
				</div>
			) : null}
			<div className="mt-2 flex justify-between">
				<Button
					size="sm"
					variant="ghost"
					className="text-destructive"
					onClick={() => removeItem(selected.index, selected.kind)}
				>
					삭제
				</Button>
				<Button size="sm" variant="ghost" onClick={onClose}>
					닫기
				</Button>
			</div>
		</Field>
	)
}

const RESIZE_EDGES = ['top', 'right', 'bottom', 'left', 'nw', 'ne', 'sw', 'se'] as const

// 각 변·꼭짓점 핸들의 gutter 내 위치와 커서. 변은 꼭짓점 사이에만(top-3 등), 꼭짓점은 size-3.
const HANDLE_STYLE: Record<Edge, { pos: string; cursor: string }> = {
	top: { pos: 'top-0 right-3 left-3 h-3', cursor: 'cursor-ns-resize' },
	bottom: { pos: 'right-3 bottom-0 left-3 h-3', cursor: 'cursor-ns-resize' },
	left: { pos: 'top-3 bottom-3 left-0 w-3', cursor: 'cursor-ew-resize' },
	right: { pos: 'top-3 right-0 bottom-3 w-3', cursor: 'cursor-ew-resize' },
	nw: { pos: 'top-0 left-0 size-3', cursor: 'cursor-nwse-resize' },
	ne: { pos: 'top-0 right-0 size-3', cursor: 'cursor-nesw-resize' },
	sw: { pos: 'bottom-0 left-0 size-3', cursor: 'cursor-nesw-resize' },
	se: { pos: 'right-0 bottom-0 size-3', cursor: 'cursor-nwse-resize' },
}

/**
 * 캔버스 바깥 gutter의 리사이즈 핸들. 배경은 평소 없고 hover/active 시에만 등장(흰색 반투명).
 * 상하좌우 변에는 항상 보이는 grip을 둬 어디를 잡는지 알린다(꼭짓점은 grip 없이 영역만).
 */
function ResizeHandle({
	edge,
	active,
	onStart,
}: {
	edge: Edge
	active: boolean
	onStart: (edge: Edge, event: React.PointerEvent<HTMLElement>) => void
}) {
	const { pos, cursor } = HANDLE_STYLE[edge]
	const isSide = edge === 'top' || edge === 'bottom' || edge === 'left' || edge === 'right'
	const horizontalGrip = edge === 'top' || edge === 'bottom'
	return (
		<button
			type="button"
			onPointerDown={(event) => onStart(edge, event)}
			aria-label={`캔버스 ${edge} 크기 조절`}
			className={`group absolute z-10 flex touch-none items-center justify-center border-0 bg-transparent p-0 ${cursor} ${pos}`}
		>
			{/* 배경: 평소 투명, hover/active 시에만 흰색 반투명 등장 */}
			<span
				className={`absolute inset-0 transition-colors ${active ? 'bg-foreground-inverse/25' : 'bg-foreground-inverse/0 group-hover:bg-foreground-inverse/15'}`}
			/>
			{/* grip: 상하좌우만, 항상 보임 */}
			{isSide && (
				<span
					className={`relative rounded-full bg-foreground-muted/60 ${horizontalGrip ? 'h-1 w-6' : 'h-6 w-1'}`}
				/>
			)}
		</button>
	)
}

/** 라벨 + 3지선다 ToggleGroup(정렬·흐름). 임시 UI — Figma 반영 예정. */
function AlignPicker<T extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string
	value: T
	options: { value: T; label: string }[]
	onChange: (value: T) => void
}) {
	return (
		<div className="flex items-center gap-2">
			<span className="type-caption-1 w-8 shrink-0 text-foreground-muted">{label}</span>
			<ToggleGroup
				type="single"
				size="sm"
				variant="outline"
				value={value}
				onValueChange={(v) => {
					if (v) onChange(v as T)
				}}
				className="flex-1"
			>
				{options.map((o) => (
					<ToggleGroupItem
						key={o.value}
						value={o.value}
						className="type-caption-1 flex-1"
					>
						{o.label}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</div>
	)
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-1.5">
			<span className="type-caption-1-emphasized text-foreground-muted">{label}</span>
			{children}
		</div>
	)
}

/** color picker + hex 입력 쌍. label로 두 컨트롤의 접근 이름을 만든다(hex는 " (hex)" 접미). */
function ColorField({
	value,
	onChange,
	label,
}: {
	value: string
	onChange: (value: string) => void
	label: string
}) {
	return (
		<>
			<input
				type="color"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				aria-label={label}
				className="h-9 w-9 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
			/>
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="flex-1"
				aria-label={`${label} (hex)`}
			/>
		</>
	)
}

/** 숫자 입력 — Enter/blur 커밋. float=true면 소수 허용(줄간격 등). */
function SizeInput({
	label,
	value,
	onCommit,
	min = MIN_CANVAS,
	float = false,
}: {
	label: string
	value: number
	onCommit: (value: number) => void
	min?: number
	float?: boolean
}) {
	const [draft, setDraft] = useState(String(value))
	useEffect(() => setDraft(String(value)), [value])
	const commit = () => {
		const n = float ? Number.parseFloat(draft) : Number.parseInt(draft, 10)
		if (Number.isFinite(n) && n >= min) onCommit(n)
		else setDraft(String(value))
	}
	return (
		<div className="type-caption-1 flex flex-1 flex-col gap-1 text-foreground-muted">
			<span>{label}</span>
			<Input
				type="number"
				step={float ? 0.1 : 1}
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault()
						commit()
					}
				}}
				onBlur={commit}
			/>
		</div>
	)
}

/** 행/열 리스트 — 각 트랙은 정수 가중치 스테퍼. 추가는 마지막에 같은 위계로 존재. */
function TrackList({
	title,
	weights,
	onCommit,
	onAdd,
	onRemove,
}: {
	title: string
	weights: number[]
	onCommit: (index: number, value: number) => void
	onAdd: () => void
	onRemove: (index: number) => void
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<span className="type-caption-1-emphasized text-foreground-muted">{title}</span>
			{weights.map((w, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: 트랙은 위치가 곧 정체성
				<div key={i} className="flex items-center gap-2">
					<Stepper value={w} min={1} onChange={(v) => onCommit(i, v)} />
					<Button
						size="icon"
						variant="ghost"
						className="size-7 text-foreground-muted hover:text-destructive"
						onClick={() => onRemove(i)}
						aria-label="트랙 삭제"
					>
						✕
					</Button>
				</div>
			))}
			{/* 추가 — 기존 트랙과 같은 위계로 맨 마지막에 */}
			<Button variant="outline" size="sm" onClick={onAdd}>
				+ 추가
			</Button>
		</div>
	)
}

/** 이산 정수 스테퍼 — [<][값][>]. 좌우 버튼이 값을 1씩 바꾸고 가운데는 표시 전용. */
function Stepper({
	value,
	onChange,
	min = 1,
}: {
	value: number
	onChange: (value: number) => void
	min?: number
}) {
	return (
		<ButtonGroup>
			<Button
				variant="outline"
				size="icon"
				disabled={value <= min}
				onClick={() => onChange(Math.max(min, value - 1))}
				aria-label="감소"
			>
				<ChevronLeft />
			</Button>
			<ButtonGroupText className="min-w-9 justify-center tabular-nums">
				{value}
			</ButtonGroupText>
			<Button
				variant="outline"
				size="icon"
				onClick={() => onChange(value + 1)}
				aria-label="증가"
			>
				<ChevronRight />
			</Button>
		</ButtonGroup>
	)
}
