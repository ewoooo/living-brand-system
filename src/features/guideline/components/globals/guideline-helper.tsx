'use client'

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { createPortal } from 'react-dom'
import { pickActiveRegion } from './guideline-active-region'

/**
 * 하단 Floating Controller("Helper") — 지금 보고 있는 블록의 컨트롤만 화면 아래 알약에 띄운다.
 *
 * 🔴 **이 바는 값을 갖지 않는다.** 값은 그대로 블록이 소유하고(`widgets/layout-grid/store.tsx`),
 *    여기는 빈 자리(slot)와 "누가 활성인가"만 안다. 바가 값을 중계하면 화면에 하나뿐인 바가
 *    블록마다 다른 값을 하나로 합쳐 버려, 슬라이더 하나가 여러 블록의 판형을 함께 움직인다
 *    (2026-08-04에 실제로 12개가 함께 움직였다 — `store.tsx`의 주석이 같은 사고를 가리킨다).
 *    그래서 컨트롤은 자기 블록의 React 트리 안에서 렌더되고 **DOM만** portal로 내려온다.
 *    context는 트리를 따라가므로 portal 너머에서도 자기 블록의 스코프를 그대로 읽는다.
 */

type HelperRegistry = {
	slot: HTMLElement | null
	setSlot: (element: HTMLElement | null) => void
	activeRegion: Element | null
	/** 관측을 시작하고 해제 함수를 돌려준다. */
	observe: (element: Element) => () => void
}

const HelperContext = createContext<HelperRegistry | null>(null)

/** 부분 노출도 잡아야 하므로 촘촘히 — 큰 판형은 화면에 다 들어오지 않는다. */
const THRESHOLDS = [0, 0.1, 0.25, 0.5, 0.75, 1]

export function GuidelineHelperProvider({ children }: { children: ReactNode }) {
	const [slot, setSlot] = useState<HTMLElement | null>(null)
	const [activeRegion, setActiveRegion] = useState<Element | null>(null)
	const areas = useRef(new Map<Element, number>())
	const observerRef = useRef<IntersectionObserver | null>(null)

	const sync = useCallback(() => {
		setActiveRegion(
			pickActiveRegion(
				[...areas.current].map(([element, visibleArea]) => ({ element, visibleArea })),
			),
		)
	}, [])

	// 🔴 root는 뷰포트가 아니라 섹션 스크롤 컨테이너다. 본문이 중첩 스크롤 안에 있어서
	//    root를 비우면 관측 기준이 화면 전체가 되고 교차 판정이 어긋난다.
	const observe = useCallback(
		(element: Element) => {
			observerRef.current ??= new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						const { width, height } = entry.intersectionRect
						areas.current.set(entry.target, entry.isIntersecting ? width * height : 0)
					}
					sync()
				},
				{
					root: document.querySelector<HTMLElement>(
						'[data-slot="section-scroll-container"]',
					),
					threshold: THRESHOLDS,
				},
			)
			const observer = observerRef.current
			observer.observe(element)
			return () => {
				observer.unobserve(element)
				areas.current.delete(element)
				sync()
			}
		},
		[sync],
	)

	useEffect(() => {
		return () => {
			observerRef.current?.disconnect()
			observerRef.current = null
		}
	}, [])

	const registry = useMemo<HelperRegistry>(
		() => ({ slot, setSlot, activeRegion, observe }),
		[slot, activeRegion, observe],
	)

	return <HelperContext.Provider value={registry}>{children}</HelperContext.Provider>
}

/**
 * 바가 앉는 자리. 목차(`guideline-on-this-page`)가 쓰는 것과 같은 방식이다 —
 * `absolute inset-0`으로 본문 높이만큼 자리를 잡고 그 안에서 sticky로 떠 있는다.
 * `fixed`가 아닌 이유는 사이드바 폭이 접힘에 따라 변해서, 뷰포트 기준으로 가운데를 잡으면
 * 본문 가운데와 어긋나기 때문이다.
 *
 * 🔴 `mt-auto`가 없으면 붙지 않는다. sticky는 지정한 모서리 **쪽으로만** 당긴다 — `bottom`은
 *    자연 위치가 기준선보다 아래일 때 위로 끌어올리는 것이지, 위에 있는 것을 아래로 밀지 않는다.
 *    정렬 없이 자리 상자 맨 위에 두면 본문 꼭대기에 그대로 남아 화면에서 보이지 않는다(실측).
 */
export function GuidelineHelperSlot() {
	const registry = useContext(HelperContext)

	return (
		<div className="pointer-events-none absolute inset-0 flex flex-col">
			<div
				ref={registry?.setSlot}
				className="sticky bottom-10 mt-auto flex justify-center px-4 pt-4"
			/>
		</div>
	)
}

/**
 * 컨트롤을 가진 블록이 자기 **관측 영역**을 선언한다. 영역이 화면에 걸려 있는 동안에만
 * `controls`가 하단 바로 올라간다. 영역은 제목·본문이 아니라 **조작 대상이 놓인 면**이어야 한다 —
 * 판형이 화면 밖인데 슬라이더만 남으면 움직여도 아무 변화가 안 보인다.
 */
export function GuidelineHelperRegion({
	label,
	controls,
	children,
}: {
	label?: string | null
	controls: ReactNode
	children: ReactNode
}) {
	const registry = useContext(HelperContext)
	const regionRef = useRef<HTMLDivElement>(null)
	const observe = registry?.observe

	useEffect(() => {
		const element = regionRef.current
		if (!element || !observe) return
		return observe(element)
	}, [observe])

	const active = registry?.activeRegion != null && registry.activeRegion === regionRef.current

	return (
		<>
			<div ref={regionRef}>{children}</div>
			{active && registry?.slot
				? createPortal(
						<GuidelineHelperBar label={label}>{controls}</GuidelineHelperBar>,
						registry.slot,
					)
				: null}
		</>
	)
}

/**
 * 알약. 겉모습은 Figma `Helper.Container`(HD_LBS_UI 61:4672)에서 왔다.
 * 위젯 갤러리(`components/widgets/gallery.tsx`)도 이것으로 감싼다 — 컨트롤 위젯은 알약 밖에서
 * 쓰이지 않으므로, 감싸지 않으면 갤러리가 실제 화면과 다른 모습을 보여준다.
 */
export function GuidelineHelperBar({
	label,
	children,
}: {
	label?: string | null
	children: ReactNode
}) {
	return (
		// biome-ignore lint/a11y/useSemanticElements: 컨트롤 묶음이지 문서 구획이 아니라 <section>이 아니다.
		<div
			role="region"
			// portal로 내려와 자기 그림에서 DOM상 떨어지므로, 어느 블록의 컨트롤인지는 이름이 유일한 단서다.
			aria-label={label ? `${label} 조절` : '레이아웃 조절'}
			className="pointer-events-auto flex items-center gap-2 rounded-lg bg-popover p-1 text-popover-foreground shadow-lg"
		>
			{children}
		</div>
	)
}
