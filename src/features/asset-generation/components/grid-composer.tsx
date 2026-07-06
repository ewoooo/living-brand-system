'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import Moveable from 'react-moveable'
import { TemplateRenderer } from '@/components/template-renderer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Toggle } from '@/components/ui/toggle'
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

type Edge = 'left' | 'right' | 'top' | 'bottom' | 'nw' | 'ne' | 'sw' | 'se'

const clamp = (n: number) => Math.max(MIN_CANVAS, Math.min(MAX_CANVAS, Math.round(n)))
const GRAY =
	"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23cbcbcb'/></svg>"

function trackSizes(weights: number[], total: number) {
	const sum = weights.reduce((a, b) => a + b, 0) || 1
	return weights.map((w) => (total * w) / sum)
}
function offsetAt(sizes: number[], i: number) {
	return sizes.slice(0, i).reduce((a, b) => a + b, 0)
}
function trackAt(sizes: number[], pos: number) {
	let acc = 0
	for (let i = 0; i < sizes.length; i++) {
		acc += sizes[i]
		if (pos < acc) return i
	}
	return sizes.length - 1
}

interface ComposerElement {
	id: string
	kind: 'text' | 'image'
	row: number
	col: number
	text: string
	src: string
}

/** 템플릿(source)에서 캔버스·그리드·요소 초기 상태를 복원한다. grid 없으면 기본값. */
function deriveInitial(source?: JsonTemplate) {
	const canvasW = source?.width ?? DEFAULT_CANVAS
	const canvasH = source?.height ?? DEFAULT_CANVAS
	const padX = source?.padding?.x ?? 0
	const padY = source?.padding?.y ?? 0
	const rows = source?.grid?.rows ?? [1, 2, 1]
	const cols = source?.grid?.columns ?? [2, 1, 1]
	const elements: ComposerElement[] = []

	if (source?.grid) {
		const colSizes = trackSizes(cols, Math.max(1, canvasW - padX * 2))
		const rowSizes = trackSizes(rows, Math.max(1, canvasH - padY * 2))
		for (const el of source.elements) {
			if (el.type !== 'text' && el.type !== 'image') continue
			elements.push({
				id: el.id,
				kind: el.type,
				row: trackAt(rowSizes, el.y - padY),
				col: trackAt(colSizes, el.x - padX),
				text: el.type === 'text' ? el.text : '',
				src: el.type === 'image' ? el.src : GRAY,
			})
		}
	}

	return { canvasW, canvasH, padX, padY, rows, cols, elements }
}

export function GridComposer({ source }: { source?: JsonTemplate }) {
	const initial = useMemo(() => deriveInitial(source), [source])
	// 표시 배율은 마운트 시 고정 — 캔버스 크기를 바꾸면 표시 크기가 실제로 변한다.
	const scale = PREVIEW_WIDTH / initial.canvasW

	const [canvasW, setCanvasW] = useState(initial.canvasW)
	const [canvasH, setCanvasH] = useState(initial.canvasH)
	const [padX, setPadX] = useState(initial.padX)
	const [padY, setPadY] = useState(initial.padY)
	const [rows, setRows] = useState<number[]>(initial.rows)
	const [cols, setCols] = useState<number[]>(initial.cols)
	const [elements, setElements] = useState<ComposerElement[]>(initial.elements)
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [dragFree, setDragFree] = useState<{ id: string; x: number; y: number } | null>(null)
	const [dropCell, setDropCell] = useState<{ row: number; col: number } | null>(null)
	const [moveableTarget, setMoveableTarget] = useState<HTMLElement | null>(null)
	const [resizing, setResizing] = useState<Edge | null>(null)
	const [showGrid, setShowGrid] = useState(true)
	const canvasRef = useRef<HTMLDivElement>(null)
	const idRef = useRef(0)
	const rafRef = useRef<number | null>(null)
	const pendingRef = useRef<{ w: number; h: number } | null>(null)

	// 그리드는 캔버스 안쪽 여백(padX·padY) 영역에 배치된다.
	const innerW = Math.max(1, canvasW - padX * 2)
	const innerH = Math.max(1, canvasH - padY * 2)
	const rowSizes = useMemo(() => trackSizes(rows, innerH), [rows, innerH])
	const colSizes = useMemo(() => trackSizes(cols, innerW), [cols, innerW])

	function cellBox(row: number, col: number) {
		const r = Math.min(row, rowSizes.length - 1)
		const c = Math.min(col, colSizes.length - 1)
		return {
			x: padX + offsetAt(colSizes, c),
			y: padY + offsetAt(rowSizes, r),
			width: colSizes[c],
			height: rowSizes[r],
		}
	}

	function nextCell(): { row: number; col: number } {
		for (let i = 0; i < rows.length * cols.length; i++) {
			const row = Math.floor(i / cols.length)
			const col = i % cols.length
			if (!elements.some((el) => el.row === row && el.col === col)) return { row, col }
		}
		return { row: 0, col: 0 }
	}

	function addElement(kind: 'text' | 'image') {
		const id = `e${idRef.current++}`
		const { row, col } = nextCell()
		setElements((prev) => [
			...prev,
			{ id, kind, row, col, text: kind === 'text' ? '텍스트' : '', src: GRAY },
		])
		setSelectedId(id)
	}

	function patch(id: string, next: Partial<ComposerElement>) {
		setElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...next } : el)))
	}
	function remove(id: string) {
		setElements((prev) => prev.filter((el) => el.id !== id))
		setSelectedId(null)
	}

	function setWeight(axis: 'row' | 'col', index: number, value: number) {
		const clamped = Number.isFinite(value) && value > 0 ? Math.round(value) : 1
		;(axis === 'row' ? setRows : setCols)((prev) =>
			prev.map((w, i) => (i === index ? clamped : w)),
		)
	}
	function addTrack(axis: 'row' | 'col') {
		;(axis === 'row' ? setRows : setCols)((prev) => [...prev, 1])
	}
	function removeTrack(axis: 'row' | 'col', index: number) {
		const list = axis === 'row' ? rows : cols
		if (list.length <= 1) return
		;(axis === 'row' ? setRows : setCols)((prev) => prev.filter((_, i) => i !== index))
	}

	// 테두리 드래그로 캔버스 크기 조절 — 가운데 정렬은 컨테이너가 유지한다.
	// 성능: 포인터 캡처로 이벤트 독점, 시작값 기준 절대 delta, rAF로 프레임당 1회만 반영(떨림 방지).
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

	const template = useMemo<JsonTemplate>(() => {
		const els = elements.map((el) => {
			const r = Math.min(el.row, rowSizes.length - 1)
			const c = Math.min(el.col, colSizes.length - 1)
			const cell = {
				x: padX + offsetAt(colSizes, c),
				y: padY + offsetAt(rowSizes, r),
				width: colSizes[c],
				height: rowSizes[r],
			}
			const box = dragFree?.id === el.id ? { ...cell, x: dragFree.x, y: dragFree.y } : cell
			if (el.kind === 'text') {
				return {
					id: el.id,
					type: 'text' as const,
					...box,
					zIndex: 2,
					locked: false,
					text: el.text,
					fontSize: 40,
					fontFamily: 'Pretendard, sans-serif',
					fontWeight: '400',
					color: '#1f2a24',
					lineHeight: 1.4,
					letterSpacing: 0,
					textAlign: 'left' as const,
					textFit: 'fixed' as const,
					verticalAlign: 'top' as const,
					inputFormat: 'free' as const,
				}
			}
			return {
				id: el.id,
				type: 'image' as const,
				...box,
				zIndex: 2,
				locked: false,
				assetCollection: 'template-assets' as const,
				assetId: 0,
				src: el.src,
				objectFit: 'cover' as const,
				borderRadius: 0,
			}
		})
		return { width: canvasW, height: canvasH, background: '#f5f2e9', elements: els }
	}, [elements, dragFree, rowSizes, colSizes, canvasW, canvasH, padX, padY])

	const selected = elements.find((el) => el.id === selectedId) ?? null

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

						{/* 그리드 라인 — n개 트랙이면 내부 경계 n-1개(외곽선 제외). 가이드라 클릭 통과. */}
						{showGrid && (
							<>
								{rowSizes.slice(1).map((_, i) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: 경계는 위치가 곧 정체성
										key={`h-${i}`}
										className="pointer-events-none absolute bg-neutral-500/30"
										style={{
											left: padX * scale,
											top: (padY + offsetAt(rowSizes, i + 1)) * scale,
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
										className="pointer-events-none absolute bg-neutral-500/30"
										style={{
											left: (padX + offsetAt(colSizes, j + 1)) * scale,
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

						{elements.map((el) => {
							const cell = cellBox(el.row, el.col)
							const box =
								dragFree?.id === el.id
									? { ...cell, x: dragFree.x, y: dragFree.y }
									: cell
							const isSelected = el.id === selectedId
							return (
								<button
									type="button"
									key={el.id}
									ref={isSelected ? setMoveableTarget : undefined}
									onClick={() => setSelectedId(isSelected ? null : el.id)}
									className={`absolute cursor-move p-0 ${isSelected ? 'ring-2 ring-primary' : ''}`}
									style={{
										left: box.x * scale,
										top: box.y * scale,
										width: box.width * scale,
										height: box.height * scale,
										background: 'transparent',
										touchAction: 'none',
										zIndex: 3,
									}}
									aria-label={`${el.kind} 요소`}
								/>
							)
						})}

						{selected && moveableTarget && (
							<Moveable
								flushSync={flushSync}
								target={moveableTarget}
								draggable
								origin={false}
								renderDirections={[]}
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
											row: trackAt(rowSizes, py),
											col: trackAt(colSizes, px),
										})
									}
								}}
								onDragEnd={() => {
									if (dropCell)
										patch(selected.id, { row: dropCell.row, col: dropCell.col })
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

				<Separator />

				<div className="flex gap-2">
					<Button size="sm" className="flex-1" onClick={() => addElement('text')}>
						+ 텍스트
					</Button>
					<Button
						size="sm"
						variant="secondary"
						className="flex-1"
						onClick={() => addElement('image')}
					>
						+ 이미지
					</Button>
				</div>

				<Separator />

				<Toggle
					size="sm"
					pressed={showGrid}
					onPressedChange={setShowGrid}
					className="justify-start"
				>
					{showGrid ? '그리드 숨기기' : '그리드 보기'}
				</Toggle>

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
						<Field label={`선택한 ${selected.kind === 'text' ? '텍스트' : '이미지'}`}>
							{selected.kind === 'text' ? (
								<Textarea
									rows={3}
									value={selected.text}
									onChange={(e) => patch(selected.id, { text: e.target.value })}
								/>
							) : (
								<Input
									type="file"
									accept="image/*"
									onChange={(e) => {
										const file = e.target.files?.[0]
										if (file)
											patch(selected.id, { src: URL.createObjectURL(file) })
									}}
								/>
							)}
							<div className="mt-2 flex justify-between">
								<Button
									size="sm"
									variant="ghost"
									className="text-destructive"
									onClick={() => remove(selected.id)}
								>
									삭제
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => setSelectedId(null)}
								>
									닫기
								</Button>
							</div>
						</Field>
					</>
				)}
			</aside>
		</section>
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
				className={`absolute inset-0 transition-colors ${active ? 'bg-white/25' : 'bg-white/0 group-hover:bg-white/15'}`}
			/>
			{/* grip: 상하좌우만, 항상 보임 */}
			{isSide && (
				<span
					className={`relative rounded-full bg-muted-foreground/60 ${horizontalGrip ? 'h-1 w-6' : 'h-6 w-1'}`}
				/>
			)}
		</button>
	)
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-1.5">
			<span className="font-medium text-muted-foreground text-xs">{label}</span>
			{children}
		</div>
	)
}

/** 캔버스 크기·여백 정수 입력 — Enter/blur 커밋. */
function SizeInput({
	label,
	value,
	onCommit,
	min = MIN_CANVAS,
}: {
	label: string
	value: number
	onCommit: (value: number) => void
	min?: number
}) {
	const [draft, setDraft] = useState(String(value))
	useEffect(() => setDraft(String(value)), [value])
	const commit = () => {
		const n = Number.parseInt(draft, 10)
		if (Number.isFinite(n) && n >= min) onCommit(n)
		else setDraft(String(value))
	}
	return (
		<div className="flex flex-1 flex-col gap-1 text-muted-foreground text-xs">
			<span>{label}</span>
			<Input
				type="number"
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

/** 행/열 리스트 — 정수 가중치(fill), 추가·삭제. Enter/blur 커밋 → 실시간 반영. */
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
	const sum = weights.reduce((a, b) => a + b, 0)
	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between">
				<span className="font-medium text-muted-foreground text-xs">{title}</span>
				<Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={onAdd}>
					+ 추가
				</Button>
			</div>
			{weights.map((w, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: 트랙은 위치가 곧 정체성
				<div key={i} className="flex items-center gap-2">
					<span className="w-4 text-muted-foreground text-xs">{i + 1}</span>
					<WeightInput value={w} onCommit={(v) => onCommit(i, v)} />
					<span className="w-9 text-muted-foreground text-xs">
						{Math.round((w / sum) * 100)}%
					</span>
					<Button
						size="icon"
						variant="ghost"
						className="size-6 text-muted-foreground hover:text-destructive"
						onClick={() => onRemove(i)}
						aria-label="트랙 삭제"
					>
						✕
					</Button>
				</div>
			))}
		</div>
	)
}

/** 정수만, Enter 또는 blur에 커밋 → 실시간 반영. */
function WeightInput({ value, onCommit }: { value: number; onCommit: (value: number) => void }) {
	const [draft, setDraft] = useState(String(value))
	useEffect(() => setDraft(String(value)), [value])
	const commit = () => {
		const n = Number.parseInt(draft, 10)
		if (Number.isFinite(n) && n > 0) onCommit(n)
		else setDraft(String(value))
	}
	return (
		<Input
			type="number"
			min={1}
			value={draft}
			onChange={(e) => setDraft(e.target.value)}
			onKeyDown={(e) => {
				if (e.key === 'Enter') {
					e.preventDefault()
					commit()
				}
			}}
			onBlur={commit}
			className="h-8 w-16"
		/>
	)
}
