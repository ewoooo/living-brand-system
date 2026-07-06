'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import Moveable from 'react-moveable'
import { TemplateRenderer } from '@/components/template-renderer'
import { Button } from '@/components/ui/button'
import type { JsonTemplate } from '@/types/json-template'

/**
 * [POC] grid system 위에 순수 text/image 요소만 얹는 컴포저.
 * 그리드(행/열 정수 가중치)는 편집 가능 — 값 변경 시 셀 좌표가 재계산되고 요소가 자동 리플로우된다.
 * 요소는 Moveable로 드래그하다 놓으면 커서가 있던 셀로 스냅. 좌상단 정렬 고정.
 * 렌더는 기존 TemplateRenderer 그대로 사용하고 요소·그리드 상태만 관리한다(서버 저장 없음).
 */

const DEFAULT_CANVAS = 1080
const PREVIEW_WIDTH = 480
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

/** 템플릿(source)에서 그리드·요소 초기 상태를 복원한다. grid 없으면 기본 그리드 + 빈 요소. */
function deriveInitial(source?: JsonTemplate) {
	const rows = source?.grid?.rows ?? [1, 2, 1]
	const cols = source?.grid?.columns ?? [2, 1, 1]
	const elements: ComposerElement[] = []

	if (source?.grid) {
		const colSizes = trackSizes(cols, source.width)
		const rowSizes = trackSizes(rows, source.height)
		for (const el of source.elements) {
			// rect(셀 배경 등)·stack은 편집 대상이 아니다. text/image만 셀로 역매핑.
			if (el.type !== 'text' && el.type !== 'image') continue
			elements.push({
				id: el.id,
				kind: el.type,
				row: trackAt(rowSizes, el.y),
				col: trackAt(colSizes, el.x),
				text: el.type === 'text' ? el.text : '',
				src: el.type === 'image' ? el.src : GRAY,
			})
		}
	}

	return { rows, cols, elements }
}

export function GridComposer({ source }: { source?: JsonTemplate }) {
	const initial = useMemo(() => deriveInitial(source), [source])
	const canvasW = source?.width ?? DEFAULT_CANVAS
	const canvasH = source?.height ?? DEFAULT_CANVAS

	const [rows, setRows] = useState<number[]>(initial.rows)
	const [cols, setCols] = useState<number[]>(initial.cols)
	const [elements, setElements] = useState<ComposerElement[]>(initial.elements)
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [dragFree, setDragFree] = useState<{ id: string; x: number; y: number } | null>(null)
	const [dropCell, setDropCell] = useState<{ row: number; col: number } | null>(null)
	const [moveableTarget, setMoveableTarget] = useState<HTMLElement | null>(null)
	const canvasRef = useRef<HTMLDivElement>(null)
	const idRef = useRef(0)

	const rowSizes = useMemo(() => trackSizes(rows, canvasH), [rows, canvasH])
	const colSizes = useMemo(() => trackSizes(cols, canvasW), [cols, canvasW])
	const scale = PREVIEW_WIDTH / canvasW

	function cellBox(row: number, col: number) {
		const r = Math.min(row, rowSizes.length - 1)
		const c = Math.min(col, colSizes.length - 1)
		return {
			x: offsetAt(colSizes, c),
			y: offsetAt(rowSizes, r),
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

	// ── 그리드 편집 ──
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

	function boxOf(el: ComposerElement) {
		const cell = cellBox(el.row, el.col)
		if (dragFree?.id === el.id) return { ...cell, x: dragFree.x, y: dragFree.y }
		return cell
	}

	const template = useMemo<JsonTemplate>(() => {
		const els = elements.map((el) => {
			// boxOf를 인라인 — memo가 rowSizes·colSizes·dragFree를 직접 의존하게 한다.
			const r = Math.min(el.row, rowSizes.length - 1)
			const c = Math.min(el.col, colSizes.length - 1)
			const cell = {
				x: offsetAt(colSizes, c),
				y: offsetAt(rowSizes, r),
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
	}, [elements, dragFree, rowSizes, colSizes, canvasW, canvasH])

	const selected = elements.find((el) => el.id === selectedId) ?? null

	return (
		<section className="flex flex-col gap-4 md:flex-row md:items-start">
			{/* ── 그리드 편집 패널 ── */}
			<div className="flex w-56 flex-col gap-4">
				<div className="flex gap-2">
					<Button size="sm" onClick={() => addElement('text')}>
						+ 텍스트
					</Button>
					<Button size="sm" variant="secondary" onClick={() => addElement('image')}>
						+ 이미지
					</Button>
				</div>
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
			</div>

			{/* ── 캔버스 ── */}
			<div
				ref={canvasRef}
				className="relative inline-block shrink-0 overflow-hidden rounded-md border border-border"
				style={{ width: canvasW * scale, height: canvasH * scale }}
			>
				<TemplateRenderer template={template} scale={scale} />

				{dragFree &&
					dropCell &&
					(() => {
						const box = cellBox(dropCell.row, dropCell.col)
						return (
							<div
								style={{
									position: 'absolute',
									left: box.x * scale,
									top: box.y * scale,
									width: box.width * scale,
									height: box.height * scale,
									background: 'rgba(63,107,79,0.28)',
									border: '2px solid #3f6b4f',
									pointerEvents: 'none',
									zIndex: 5,
								}}
							/>
						)
					})()}

				{elements.map((el) => {
					const box = boxOf(el)
					const isSelected = el.id === selectedId
					return (
						<button
							type="button"
							key={el.id}
							ref={isSelected ? setMoveableTarget : undefined}
							onClick={() => setSelectedId(isSelected ? null : el.id)}
							style={{
								position: 'absolute',
								left: box.x * scale,
								top: box.y * scale,
								width: box.width * scale,
								height: box.height * scale,
								background: 'transparent',
								border: isSelected ? '1px solid #3f6b4f' : '1px dashed transparent',
								cursor: 'move',
								touchAction: 'none',
								padding: 0,
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
								const px = (event.clientX - rect.left) / scale
								const py = (event.clientY - rect.top) / scale
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

				{selected && !dragFree && (
					<div
						className="absolute z-10 flex w-56 flex-col gap-2 rounded-md border border-border bg-background p-3 shadow-md"
						style={{
							left: Math.min(
								cellBox(selected.row, selected.col).x * scale,
								PREVIEW_WIDTH - 224,
							),
							top: cellBox(selected.row, selected.col).y * scale + 8,
						}}
					>
						{selected.kind === 'text' ? (
							<textarea
								// biome-ignore lint/a11y/noAutofocus: 클릭 즉시 편집 진입
								autoFocus
								className="w-full rounded border border-border p-2 text-sm"
								rows={3}
								value={selected.text}
								onChange={(e) => patch(selected.id, { text: e.target.value })}
							/>
						) : (
							<input
								type="file"
								accept="image/*"
								className="text-xs"
								onChange={(e) => {
									const file = e.target.files?.[0]
									if (file) patch(selected.id, { src: URL.createObjectURL(file) })
								}}
							/>
						)}
						<div className="flex justify-between">
							<button
								type="button"
								className="text-destructive text-xs"
								onClick={() => remove(selected.id)}
							>
								삭제
							</button>
							<button
								type="button"
								className="text-muted-foreground text-xs"
								onClick={() => setSelectedId(null)}
							>
								닫기
							</button>
						</div>
					</div>
				)}
			</div>
		</section>
	)
}

/** 행/열 리스트 — 정수 가중치 입력(Enter/blur 커밋), 추가·삭제. 전부 fill. */
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
				<span className="font-medium text-xs">{title}</span>
				<button type="button" className="text-muted-foreground text-xs" onClick={onAdd}>
					+ 추가
				</button>
			</div>
			{weights.map((w, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: 트랙은 위치가 곧 정체성
				<div key={i} className="flex items-center gap-2">
					<span className="w-4 text-muted-foreground text-xs">{i + 1}</span>
					<WeightInput value={w} onCommit={(v) => onCommit(i, v)} />
					<span className="w-9 text-muted-foreground text-xs">
						{Math.round((w / sum) * 100)}%
					</span>
					<button
						type="button"
						className="text-muted-foreground text-xs hover:text-destructive"
						onClick={() => onRemove(i)}
						aria-label="트랙 삭제"
					>
						✕
					</button>
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
		<input
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
			className="w-14 rounded border border-border px-2 py-1 text-sm"
		/>
	)
}
