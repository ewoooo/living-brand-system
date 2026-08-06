'use client'

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { formatImageEditTransform } from '@/services/compose-template-html.client'
import {
	IDENTITY_TRANSFORM,
	type ImageTransform,
	isIdentityTransform,
	type Point,
	panTransform,
	rotateTransform,
	scaleTransform,
} from './image-transform-gestures'

/**
 * 캔버스 iframe 위에 얹는 직접 조작 오버레이 — 프레임 드래그=이동, 코너=확대, 상단 핸들=회전.
 * iframe 문서는 script-less·pointerEvents:none 그대로 두고, 부모 문서에서 same-origin으로
 * 측정과 라이브 피드백(캐리어 inline transform 직접 세팅)만 한다. 값 계약은 슬라이더와 같은
 * imageTransform이고 pointer-up에 한 번만 commit한다 — 프레임마다 srcDoc 재합성 thrash 방지.
 * 키보드 접근은 기존 슬라이더가 담당하는 포인터 전용 보강이다.
 * 캔버스 클릭으로 레이어를 선택하는 기능은 없다 — 선택은 레이어 목록에서(향후 과제).
 */

const HANDLE = 9 // 코너 핸들 한 변(px) — 캔버스 scale과 무관하게 화면 고정 크기
const ROTATE_STEM = 18 // 회전 핸들 스템 길이(px)

const CORNERS = [
	{ key: 'tl', left: '0%', top: '0%', cursor: 'nwse-resize' },
	{ key: 'tr', left: '100%', top: '0%', cursor: 'nesw-resize' },
	{ key: 'bl', left: '0%', top: '100%', cursor: 'nesw-resize' },
	{ key: 'br', left: '100%', top: '100%', cursor: 'nwse-resize' },
] as const

const HANDLE_STYLE = {
	position: 'absolute',
	width: HANDLE,
	height: HANDLE,
	transform: 'translate(-50%, -50%)',
	background: 'var(--theme-bg)',
	border: '1px solid var(--theme-text)',
} as const

interface Box {
	left: number
	top: number
	width: number
	height: number
}

interface Gesture {
	mode: 'pan' | 'scale' | 'rotate'
	pointerId: number
	carrier: HTMLElement
	start: ImageTransform
	/** 제스처 시작 시점의 포인터 위치(템플릿 px). */
	startPoint: Point
	/** 제스처 시작 시점의 캐리어 bounding box 중심(템플릿 px) — 확대·회전의 기준점. */
	center: Point
	/** 복원한 base transform — 라이브 피드백은 `<편집> <base>`로 다시 조립한다. */
	base: string
	/** ESC 취소용 — 제스처 시작 시점의 inline transform 원본. */
	prevTransform: string
	/** 마지막으로 적용한 값 — pointer-up에 commit. 이동이 없었으면 start와 동일 참조. */
	last: ImageTransform
}

function findNode(doc: Document | null | undefined, nodeId: string): HTMLElement | null {
	if (!doc) return null
	// nodeId에 콜론·세미콜론이 섞이므로(Figma id) selector 조립 대신 속성 비교로 찾는다 — compose와 동일 패턴.
	const el = Array.from(doc.querySelectorAll('[data-node-id]')).find(
		(candidate) => candidate.getAttribute('data-node-id') === nodeId,
	)
	return el instanceof HTMLElement ? el : null
}

export function ImageTransformOverlay({
	iframeRef,
	nodeId,
	onCommit,
	scale,
	value,
}: {
	iframeRef: RefObject<HTMLIFrameElement | null>
	nodeId: string
	onCommit: (next?: ImageTransform) => void
	scale: number
	value?: ImageTransform
}) {
	// 프레임 박스는 템플릿 px로 저장하고 렌더에서만 scale을 곱한다 — scale 변경에 재측정 불필요.
	const [frameBox, setFrameBox] = useState<Box | null>(null)
	const gestureRef = useRef<Gesture | null>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	// iframe 내부 rect는 iframe 뷰포트 기준 = 템플릿 px — 부모의 CSS scale은 좌표에 영향이 없고,
	// iframe이 템플릿 원본 크기로 렌더되므로 내부 스크롤도 없다.
	const measure = useCallback(() => {
		const frame = findNode(iframeRef.current?.contentDocument, nodeId)
		if (!frame) {
			setFrameBox(null)
			return
		}
		const rect = frame.getBoundingClientRect()
		setFrameBox({ left: rect.left, top: rect.top, width: rect.width, height: rect.height })
	}, [iframeRef, nodeId])

	// 선택 변경 시 즉시 측정 + commit이 srcDoc을 갈아끼울 때(load)마다 재측정.
	useEffect(() => {
		measure()
		const iframe = iframeRef.current
		if (!iframe) return
		iframe.addEventListener('load', measure)
		return () => iframe.removeEventListener('load', measure)
	}, [measure, iframeRef])

	// ESC = 제스처 취소: 시작 시점 transform 복원 후 commit 없이 종료.
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const gesture = gestureRef.current
			if (!gesture || event.key !== 'Escape') return
			gesture.carrier.style.transform = gesture.prevTransform
			gestureRef.current = null
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [])

	// 화면 px → 템플릿 px. iframe rect는 scale이 적용된 시각적 박스이므로 나누면 된다.
	const toTemplatePoint = (event: { clientX: number; clientY: number }): Point => {
		const rect = iframeRef.current?.getBoundingClientRect()
		if (!rect) return { x: 0, y: 0 }
		return { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale }
	}

	function startGesture(event: React.PointerEvent, mode: Gesture['mode']) {
		if (event.button !== 0 || gestureRef.current) return
		const frame = findNode(iframeRef.current?.contentDocument, nodeId)
		// 캐리어 사각형을 직접 선택한 경우 자신이 캐리어다 — compose와 같은 해석 규칙.
		const carrier = frame?.matches('[data-image-carrier]')
			? frame
			: frame?.querySelector('[data-image-carrier]')
		if (!(carrier instanceof HTMLElement)) return
		event.preventDefault()
		containerRef.current?.setPointerCapture(event.pointerId)

		// base transform 복원: compose가 만든 inline은 `<커밋된 편집> <base>` 또는 `<base>`뿐이고,
		// 편집 문자열은 같은 포매터(formatImageEditTransform)가 현재 값에서 재생성한 것과 글자까지
		// 같으므로 prefix strip이 결정적으로 base를 돌려준다.
		const inline = carrier.style.transform
		const committed =
			value && !isIdentityTransform(value) ? formatImageEditTransform(value) : ''
		const base =
			committed && inline.startsWith(committed)
				? inline.slice(committed.length).trim()
				: inline

		const carrierRect = carrier.getBoundingClientRect()
		const start = value ?? IDENTITY_TRANSFORM
		gestureRef.current = {
			mode,
			pointerId: event.pointerId,
			carrier,
			start,
			startPoint: toTemplatePoint(event),
			center: {
				x: carrierRect.left + carrierRect.width / 2,
				y: carrierRect.top + carrierRect.height / 2,
			},
			base,
			prevTransform: inline,
			last: start,
		}
	}

	function handlePointerMove(event: React.PointerEvent) {
		const gesture = gestureRef.current
		if (!gesture || event.pointerId !== gesture.pointerId) return
		const point = toTemplatePoint(event)
		const next =
			gesture.mode === 'pan'
				? panTransform(
						gesture.start,
						point.x - gesture.startPoint.x,
						point.y - gesture.startPoint.y,
					)
				: gesture.mode === 'scale'
					? scaleTransform(gesture.start, gesture.center, gesture.startPoint, point)
					: rotateTransform(gesture.start, gesture.center, gesture.startPoint, point)
		gesture.last = next
		const edit = isIdentityTransform(next) ? '' : formatImageEditTransform(next)
		gesture.carrier.style.transform = [edit, gesture.base].filter(Boolean).join(' ')
	}

	function handlePointerUp(event: React.PointerEvent) {
		const gesture = gestureRef.current
		if (!gesture || event.pointerId !== gesture.pointerId) return
		gestureRef.current = null
		if (gesture.last === gesture.start) return // 이동 없음 — 재합성하지 않는다.
		onCommit(isIdentityTransform(gesture.last) ? undefined : gesture.last)
	}

	if (!frameBox) return null

	return (
		// 포인터 전용 보강이라 핸들은 포커스 대상이 아니다 — 키보드 경로는 슬라이더.
		<div
			ref={containerRef}
			role="presentation"
			style={{
				position: 'absolute',
				left: frameBox.left * scale,
				top: frameBox.top * scale,
				width: frameBox.width * scale,
				height: frameBox.height * scale,
				border: '1px solid var(--theme-text)',
				cursor: 'move',
				touchAction: 'none',
			}}
			onPointerDown={(event) => startGesture(event, 'pan')}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
		>
			{CORNERS.map((corner) => (
				<div
					key={corner.key}
					style={{
						...HANDLE_STYLE,
						left: corner.left,
						top: corner.top,
						cursor: corner.cursor,
					}}
					onPointerDown={(event) => {
						event.stopPropagation()
						startGesture(event, 'scale')
					}}
				/>
			))}
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: -ROTATE_STEM,
					width: 1,
					height: ROTATE_STEM,
					background: 'var(--theme-text)',
					pointerEvents: 'none',
				}}
			/>
			<div
				style={{
					...HANDLE_STYLE,
					left: '50%',
					top: -ROTATE_STEM - HANDLE / 2,
					width: 11,
					height: 11,
					borderRadius: '50%',
					cursor: 'grab',
				}}
				onPointerDown={(event) => {
					event.stopPropagation()
					startGesture(event, 'rotate')
				}}
			/>
		</div>
	)
}
