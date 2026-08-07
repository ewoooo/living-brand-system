'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BRAND_FONT_STACK, LEADING } from '../brand-typeface'

// 무작위 글자가 좌라라락 흐르다 목표 문자열로 굳는다. 규정을 설명하는 화면이 아니라 서체를 보는 화면이라
// 판 위에 글자만 크게 둔다 — 판을 누르면 다시 굴러가고, 다 굳으면 다음 문자열로 넘어간다.

/** 판 높이. 글자 크기는 이 높이와 폭에 맞춰 런타임에 정해진다. */
const PANEL_HEIGHT = '20rem'
/** 글자 하나가 굳고 그다음 글자가 굳기까지. 왼쪽부터 차례로 잠기는 느낌을 이 간격이 만든다. */
const STAGGER_MS = 70
/** 다 굳은 뒤 머무는 시간. */
const HOLD_MS = 2000
/**
 * 무작위 글자를 갈아 끼우는 간격. 매 프레임(60fps) 바꾸면 잔상이 뭉개져 오히려 안 읽힌다.
 * rAF로 돌리되 갱신은 이 간격으로 솎는다.
 */
const TICK_MS = 45
/** 크기를 잴 때 쓰는 기준 글자 크기(px). 클수록 비율 오차가 작다. */
const MEASURE_PX = 100
/**
 * 잰 크기에서 남기는 여백. 스크램블 중인 글자는 목표 글자보다 넓을 수 있어(글자마다 폭이 다르다)
 * 딱 맞게 채우면 오른쪽이 잘린다. 폰트 수치가 아니라 여백 정책이라 서체가 바뀌어도 유효하다.
 */
const FIT_MARGIN = 0.94
/**
 * 한 줄짜리라 행간이 실제로 쓰이진 않지만, 상자 높이를 재려면 기준이 필요하다.
 * 눈대중 숫자 대신 Head Copy 규정 최소값을 쓴다.
 */
const LINE_HEIGHT = LEADING.ko.head[0] / 100

export function TypeScrambleView({
	targets,
	weight,
	synthetic,
	weightLabel,
}: {
	targets: string[]
	weight: number
	synthetic: boolean
	weightLabel: string
}) {
	// cycle은 순번이 아니라 "몇 번째 재생인가"다. 문자열이 하나뿐이라 순번이 안 바뀌는 경우에도
	// 값이 늘어나야 다음 회차를 다시 걸 수 있다.
	const [cycle, setCycle] = useState(0)
	const target = pick(targets, cycle)
	const [display, setDisplay] = useState(target)

	/**
	 * 🔴 무작위 글자는 **목표 문자열들에 실제로 쓰인 글자**에서만 뽑는다. 한글은 11,172자라 임의 글자를
	 *    뽑으면 서브셋에 없어 두부(□)가 뜬다. 쓰인 글자만 섞으면 눈에는 무작위인데 글리프는 항상 있다.
	 *    Set은 코드포인트 단위로 순회하므로 서로게이트 쌍이 쪼개지지 않는다.
	 */
	const pool = useMemo(
		() => [...new Set(Array.from(targets.join('')).filter((ch) => !/\s/.test(ch)))],
		[targets],
	)

	// 회차마다 다시 걸린다 — cycle에서 이번 문자열을 뽑으므로 문자열이 하나여도 loop가 이어진다.
	useEffect(() => {
		const current = pick(targets, cycle)

		// 뽑을 글자가 사실상 없으면(예: 'AAAA') 섞어도 안 섞인 것과 같다 — 그냥 보여준다.
		// 모션 축소를 켜 뒀으면 스크램블 없이 최종 문자열만 보여준다(다음 문자열은 클릭으로 넘긴다).
		if (pool.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
			setDisplay(current)
			return
		}

		const settleAt = Array.from(current).length * STAGGER_MS
		let raf = 0
		let start = 0
		let lastTick = 0

		const step = (now: number) => {
			if (!start) start = now
			const elapsed = now - start

			if (elapsed >= settleAt + HOLD_MS) {
				setDisplay(current)
				setCycle((c) => c + 1)
				return
			}
			if (now - lastTick >= TICK_MS) {
				lastTick = now
				setDisplay(scrambleFrame(current, pool, elapsed))
			}
			raf = requestAnimationFrame(step)
		}

		raf = requestAnimationFrame(step)
		// 🔴 언마운트·재실행에서 반드시 멈춘다. 안 그러면 회차마다 loop가 하나씩 늘어난다.
		return () => cancelAnimationFrame(raf)
	}, [cycle, targets, pool])

	const { boxRef, ghostRef, fontSize } = useFittedFontSize()
	const typeStyle = { fontFamily: BRAND_FONT_STACK, fontWeight: weight, lineHeight: LINE_HEIGHT }

	return (
		<div className="flex w-full flex-col gap-2">
			<button
				type="button"
				onClick={() => setCycle((c) => c + 1)}
				// 굳은 문자열이 접근성 이름이다 — 흐르는 글자를 읽어 주면 소음만 된다.
				aria-label={`${target}. 누르면 다시 재생합니다.`}
				className="grid w-full cursor-pointer overflow-hidden border border-border bg-muted p-6 text-left outline-none ring-foreground/60 focus-visible:ring-2 focus-visible:ring-inset"
				// 🔴 높이를 재는 상자가 판 높이를 실제로 받아야 한다. `h-full`은 <button> 안에서 믿을 수
				//    없다 — UA가 버튼 내용을 익명 컨테이너에 담아 백분율 높이가 auto로 풀릴 수 있고,
				//    그러면 상자 높이 0 → 배율 0으로 글자가 영영 안 뜬다. 트랙을 minmax(0, 1fr)로 못
				//    박아 자식이 판 높이를 그대로 받게 한다(1fr은 minmax(auto, 1fr)이라 안 된다).
				style={{ height: PANEL_HEIGHT, gridTemplateRows: 'minmax(0, 1fr)' }}
			>
				<span ref={boxRef} className="relative flex items-center">
					<span
						aria-hidden="true"
						className="whitespace-pre text-foreground"
						style={{
							...typeStyle,
							fontSize,
							// 재기 전 한 프레임 동안 엉뚱한 크기로 번쩍이지 않게 감춘다.
							visibility: fontSize ? 'visible' : 'hidden',
						}}
					>
						{display}
					</span>
					{/*
						크기 측정용 그림자. 목표 문자열을 기준 크기로 깔아 두고 판에 맞는 배율을 얻는다.
						🔴 흐르는 글자가 아니라 **목표 문자열**을 재야 크기가 매 틱 출렁이지 않는다.
						🔴 폰트에서 잰 수치를 상수로 박지 않으려는 것이기도 하다 — 서체가 교체되면 이 측정이
						   알아서 따라간다.
					*/}
					<span
						ref={ghostRef}
						aria-hidden="true"
						className="pointer-events-none invisible absolute top-0 left-0 w-max whitespace-pre"
						style={{ ...typeStyle, fontSize: MEASURE_PX }}
					>
						{target}
					</span>
				</span>
			</button>

			<p className="px-1 font-body text-muted-foreground text-xs">
				판을 누르면 다시 재생됩니다.
				{synthetic ? (
					<span className="text-destructive">
						{' '}
						{weightLabel} 굵기는 현재 배포된 서체 파일에 없어 브라우저가 합성한
						모양입니다.
					</span>
				) : null}
			</p>
		</div>
	)
}

/** 이번 회차에 보여줄 문자열. 회차가 목록보다 길어지면 처음으로 돌아온다. */
function pick(targets: string[], cycle: number) {
	return targets[cycle % targets.length] ?? ''
}

/** 목표 문자열이 판을 채우도록 글자 크기를 런타임에 잰다. */
function useFittedFontSize() {
	const boxRef = useRef<HTMLSpanElement>(null)
	const ghostRef = useRef<HTMLSpanElement>(null)
	const [fontSize, setFontSize] = useState(0)

	useEffect(() => {
		const box = boxRef.current
		const ghost = ghostRef.current
		if (!box || !ghost) return

		const measure = () => {
			const ink = ghost.getBoundingClientRect()
			const room = Math.min(box.clientWidth / ink.width, box.clientHeight / ink.height)
			// 판이나 그림자가 아직 0이면(첫 프레임·숨겨진 탭) 재지 않는다. 0을 쓰면 글자가 사라진 채
			// 굳는다 — 다시 보이면 ResizeObserver가 또 부르므로 그때 제 크기를 잡는다.
			if (!Number.isFinite(room) || room <= 0) return
			setFontSize(MEASURE_PX * room * FIT_MARGIN)
		}

		// 판과 그림자를 둘 다 본다. 판이 줄면 글자도 줄고, 그림자가 달라지면(문자열·굵기 교체,
		// 서체 늦은 도착) 그 자체가 다시 재라는 신호다 — 그래서 문자열을 의존성으로 들 필요가 없다.
		// 그림자는 MEASURE_PX 고정이라 여기서 정한 크기가 그림자를 되흔드는 되먹임은 없다.
		const observer = new ResizeObserver(measure)
		observer.observe(box)
		observer.observe(ghost)
		return () => observer.disconnect()
	}, [])

	return { boxRef, ghostRef, fontSize }
}

/** 아직 안 굳은 자리만 무작위 글자로 채운다. 왼쪽 글자부터 차례로 굳는다. */
export function scrambleFrame(target: string, pool: string[], elapsed: number) {
	return Array.from(target)
		.map((ch, i) => {
			// 공백은 섞지 않는다 — 낱말 경계가 매 틱 흔들리면 글자 수가 같아도 판형이 출렁인다.
			if (/\s/.test(ch) || elapsed >= (i + 1) * STAGGER_MS) return ch
			return pool[Math.floor(Math.random() * pool.length)]
		})
		.join('')
}
