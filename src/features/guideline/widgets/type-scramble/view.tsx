'use client'

import { useEffect, useMemo, useState } from 'react'
import { BRAND_FONT_STACK, LEADING } from '../brand-typeface'

// 무작위 글자가 좌라라락 흐르다 표본 문구로 굳고, 잠시 머물렀다 스스로 다시 돈다.
// 규정을 설명하는 화면이 아니라 서체를 보는 화면이라 글자 말고는 아무것도 두지 않는다
// — 테두리도, 안내문도, 재생 버튼도 없다.
//
// 🔴 글자 크기는 **고정**이다(author가 정한다). 예전에는 글자가 판을 채우도록 런타임에 맞췄는데,
//    줄이 늘면 과하게 커지고 스크램블 중 글자 폭이 바뀔 때마다 크기가 출렁였다.
// 🔴 판 높이는 **author가 정한 고정 값**이다. 글자가 가운데 서므로 위아래 여백은 그 높이에서 글자를 뺀
//    만큼이고, 손잡이는 높이 하나뿐이다 — 여백을 따로 받으면 판만 커지고 여백은 그대로라 서로 무의미해진다.

/** 글자 하나가 굳고 그다음 글자가 굳기까지. 왼쪽부터 차례로 잠기는 느낌을 이 간격이 만든다. */
const STAGGER_MS = 11
/** 다 굳은 뒤 머무는 시간. */
const HOLD_MS = 1600
/**
 * 무작위 글자를 갈아 끼우는 간격. 매 프레임(60fps) 바꾸면 잔상이 뭉개져 오히려 안 읽힌다.
 * rAF로 돌리되 갱신은 이 간격으로 솎는다.
 */
const TICK_MS = 24
/** 여러 줄 표본이라 본문 행간 규정을 쓴다(Artboard 46~48의 Body 하한). */
const LINE_HEIGHT = LEADING.ko.body[0] / 100

export function TypeScrambleView({
	text,
	fontSize,
	panelHeight,
	color,
	background,
	weight,
	synthetic,
	weightLabel,
}: {
	text: string
	fontSize: number
	panelHeight: number
	/** brand-colors에서 온 글자 색. 없으면 기본 전경색. */
	color: string | null
	/** brand-colors에서 온 판 배경색. 없으면 배경 없음. */
	background: string | null
	weight: number
	synthetic: boolean
	weightLabel: string
}) {
	const [display, setDisplay] = useState(text)

	/**
	 * 🔴 무작위 글자는 **이 문구에 실제로 쓰인 글자**에서만 뽑는다. 한글은 11,172자라 임의 글자를 뽑으면
	 *    서브셋에 없어 두부(□)가 뜬다. 쓰인 글자만 섞으면 눈에는 무작위인데 글리프는 항상 있다.
	 *    Set은 코드포인트 단위로 순회하므로 서로게이트 쌍이 쪼개지지 않는다.
	 */
	const pool = useMemo(
		() => [...new Set(Array.from(text).filter((ch) => !/\s/.test(ch)))],
		[text],
	)

	useEffect(() => {
		// 뽑을 글자가 사실상 없으면 섞어도 안 섞인 것과 같다 — 그냥 보여준다.
		// 모션 축소를 켜 뒀으면 스크램블 없이 최종 문구만 보여준다.
		if (pool.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
			setDisplay(text)
			return
		}

		const settleAt = Array.from(text).length * STAGGER_MS
		let raf = 0
		let start = 0
		let lastTick = 0

		const step = (now: number) => {
			if (!start) start = now
			const elapsed = now - start

			if (elapsed >= settleAt + HOLD_MS) {
				// 🔴 다음 회차는 **시계를 되감아** 잇는다. 회차 카운터를 state로 두면 그 값이 effect 안에서
				//    읽히지도 않으면서 의존성에만 남아, 매 회차 effect가 뜯겼다 다시 걸린다.
				start = now
				lastTick = 0
			}
			if (now - lastTick >= TICK_MS) {
				lastTick = now
				setDisplay(scrambleFrame(text, pool, now - start))
			}
			raf = requestAnimationFrame(step)
		}

		raf = requestAnimationFrame(step)
		// 🔴 언마운트·재실행에서 반드시 멈춘다. 안 그러면 loop가 하나씩 늘어난다.
		return () => cancelAnimationFrame(raf)
	}, [text, pool])

	return (
		<div className="w-full">
			<div
				className="grid w-full place-items-center overflow-hidden text-center"
				style={{
					// 🔴 고정 높이다. 스크램블은 글자 수와 줄바꿈을 보존하므로 도는 동안에도 흔들리지 않고,
					//    글자를 키우면 판이 아니라 여백이 줄어든다.
					height: panelHeight,
					// 배경도 brand-colors가 준다. 안 고르면 배경 없음.
					backgroundColor: background ?? undefined,
				}}
			>
				{/* 흐르는 글자는 읽어 주면 소음만 된다 — 보조기기에는 굳은 문구만 한 번 전한다. */}
				<span className="sr-only">{text}</span>
				<span
					aria-hidden="true"
					// 줄바꿈은 살리되 긴 줄은 접는다 — 판 폭이 좁아져도 글자가 밖으로 새지 않는다.
					className="w-full whitespace-pre-wrap break-words"
					style={{
						fontFamily: BRAND_FONT_STACK,
						fontWeight: weight,
						lineHeight: LINE_HEIGHT,
						fontSize,
						// 색을 안 고르면 기본 전경색. 브랜드 색은 brand-colors가 준다.
						color: color ?? 'var(--foreground)',
					}}
				>
					{display}
				</span>
			</div>

			{synthetic ? (
				<p className="px-1 pt-2 font-body text-destructive text-xs">
					{weightLabel} 굵기는 현재 배포된 서체 파일에 없어 브라우저가 합성한 모양입니다.
				</p>
			) : null}
		</div>
	)
}

/** 아직 안 굳은 자리만 무작위 글자로 채운다. 왼쪽 글자부터 차례로 굳는다. */
export function scrambleFrame(target: string, pool: string[], elapsed: number) {
	return Array.from(target)
		.map((ch, i) => {
			// 공백·줄바꿈은 섞지 않는다 — 낱말과 줄 경계가 매 틱 흔들리면 판형이 출렁인다.
			if (/\s/.test(ch) || elapsed >= (i + 1) * STAGGER_MS) return ch
			return pool[Math.floor(Math.random() * pool.length)]
		})
		.join('')
}
