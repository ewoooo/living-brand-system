/*
 * 락업·도판이 함께 쓰는 전환 토큰. 🔴 **`view.tsx`가 아니라 여기가 소유한다** —
 * `view.tsx` ↔ `diagram.tsx`가 서로를 import하는 순환이라, 모듈 최상위에서 그 값을 읽으면
 * 초기화 전 접근으로 터진다(실제로 `Cannot access 'MORPH_MS' before initialization`을 냈다).
 * 값만 담은 이 모듈은 누구도 import하지 않으므로 순환에 끼지 않는다.
 */

/** 표현 전환 지속시간(ms). 형태와 색이 같은 값을 써서 함께 움직인다. */
export const MORPH_MS = 420

/**
 * 전환 곡선. 🔴 **한 곡선을 CSS와 JS가 같이 쓴다** — 심볼 형태는 JS가 프레임마다 계산하고
 * 색·판·위치는 CSS/WAAPI가 하므로, 곡선이 다르면 같이 움직이는 것들이 어긋나 보인다
 * (실측으로 겪은 것: 텍스트 색만 전환이 없어 점프했고, 위치만 `ease`라 따로 놀았다).
 *
 * `easeOutQuint` 계열 — 처음에 빠르게 튀어나가고 끝을 길게 눌러 앉는다. 오버슛은 넣지 않았다:
 * 색 전환이 목표를 지나치면 색역 밖으로 나가고, 로고 형태가 규정 값을 넘어가 보이는 것도 곤란하다.
 */
const MORPH_BEZIER = [0.22, 1, 0.36, 1] as const
export const MORPH_EASING = `cubic-bezier(${MORPH_BEZIER.join(',')})`

/**
 * `cubic-bezier`의 y를 x로 구한다 — CSS가 이징으로 하는 계산을 JS에서 똑같이 한다.
 * x(t)를 뉴턴법으로 뒤집어 t를 찾고 y(t)를 낸다(브라우저 구현과 같은 방식).
 */
export function easeMorph(x: number) {
	const [x1, y1, x2, y2] = MORPH_BEZIER
	const cx = 3 * x1
	const bx = 3 * (x2 - x1) - cx
	const ax = 1 - cx - bx
	const cy = 3 * y1
	const by = 3 * (y2 - y1) - cy
	const ay = 1 - cy - by

	let t = x
	for (let i = 0; i < 8; i++) {
		const dx = ((ax * t + bx) * t + cx) * t - x
		if (Math.abs(dx) < 1e-6) break
		const slope = (3 * ax * t + 2 * bx) * t + cx
		if (Math.abs(slope) < 1e-6) break
		t -= dx / slope
	}
	return ((ay * t + by) * t + cy) * t
}

/** CSS `transition`·`animate`에 함께 쓰는 값. */
export const MORPH = `${MORPH_MS}ms ${MORPH_EASING}`

/** 움직임 줄이기를 켠 사용자에겐 전환하지 않는다. */
export function reducedMotion() {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * FLIP 한 번 — **모든 전환이 이 함수 하나를 지난다**(락업 덩어리·도판 판·도판 요소 셋 다).
 * 지속시간·곡선을 호출부가 다시 적지 않게 하려는 것이 목적이다. 값이 바뀌면 세 군데가 함께 바뀐다.
 *
 * 🔴 **출발값만 받고 도착 키프레임은 빈 객체다**(`[from, {}]`). 그러면 WAAPI가 도착값을 요소의
 *    기본 스타일에서 가져온다(암묵 to-키프레임). 도착값을 적으면 `width`·`height`처럼 **레이아웃을
 *    바꾸는** 속성에서 사고가 난다 — 전환 중에 다시 전환하면 측정이 비행 중인 값을 읽고, 그 값이
 *    도착점으로 박혀 애니메이션이 끝나 기본 스타일로 돌아가는 순간 그만큼 툭 튄다.
 * 🔴 빈 객체를 빼고 **키프레임을 하나만 주면 거꾸로 돈다** — 키프레임 하나는 offset 0이 아니라
 *    **offset 1(도착)** 으로 놓이고 출발이 기본 스타일이 된다. 실측으로 확인했다(`[{x:-40}]`는
 *    t=0에 x=0, `[{x:-40},{}]`는 t=0에 x=-40).
 * 🔴 CSS 전환(`CSSTransition`)은 지우지 않는다 — 색·배경 전환이 같은 요소에서 돌고 있을 수 있고,
 *    그것을 지우면 색이 중간에서 스냅한다. 지우는 것은 우리가 만든 FLIP뿐이다.
 */
export function morph(element: Element, from: Keyframe) {
	for (const animation of element.getAnimations())
		if (!(animation instanceof CSSTransition)) animation.cancel()
	return element.animate([from, {}], { duration: MORPH_MS, easing: MORPH_EASING })
}
