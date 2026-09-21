'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Typography } from '@/components/ui/typography'
import {
	type GeneratedImageHistoryItem,
	type GeneratedImageHistoryStack,
	groupHistoryByDate,
} from '@/features/image-generation/domain/generated-image-history'
import { useImageStudio } from '@/features/image-generation/hooks/use-image-studio'
import { fetchGeneratedImageHistory } from '@/features/image-generation/services/list-generated-image-history.client'
import { cn } from '@/lib/utils'

/**
 * 좌측 패널의 생성 이미지 갤러리 — 이 앱에서 만들어진 이미지를 내 것·남의 것 구분 없이
 * 최신순으로 보여주고, 고르면 그 값으로 편집 세션을 덮는다(사용자 지시, 2026-09-21).
 *
 * 🔴 목록은 이 컴포넌트가 소유한다(Provider에 넣지 않는다) — 편집 세션이 아니라 이 화면의
 *    표현 상태다. Provider가 들고 있으면 목록이 바뀔 때마다 캔버스까지 다시 그린다.
 * 🔑 복원 값이 없는 항목(field access가 닫힌 사용자)은 그림만 보이고 눌리지 않는다.
 *    권한 경계는 컬렉션이 선언하고, 이 화면은 그 결과를 그대로 반영한다.
 */
export function ImageHistoryGallery() {
	const { history } = useImageStudio()
	const [items, setItems] = useState<GeneratedImageHistoryItem[]>([])
	const [hasMore, setHasMore] = useState(false)
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
	// 여기까지 요청했다 — StrictMode의 이중 호출과 감지선의 연속 교차를 함께 막는다.
	// 🔴 state로 막으면 둘 다 새는 창이 있다(교차는 리렌더를 기다려 주지 않는다).
	const requested = useRef(0)
	const inFlight = useRef(false)
	const observer = useRef<IntersectionObserver | null>(null)

	/** 다음 장을 당긴다. 앞선 요청이 돌아오기 전에는 무시하므로 연속 교차가 안전하다. */
	const loadNext = useCallback(() => {
		if (inFlight.current) return
		inFlight.current = true
		const next = requested.current + 1
		requested.current = next
		setStatus('loading')
		fetchGeneratedImageHistory(next).then(
			(result) => {
				// 같은 항목이 두 번 그려지지 않게 id로 거른다 — 조회 사이에 새 이미지가 생기면
				// 페이지 경계가 밀려 직전 페이지의 꼬리가 다시 내려온다.
				setItems((current) => {
					const seen = new Set(current.map((item) => item.id))
					return [...current, ...result.items.filter((item) => !seen.has(item.id))]
				})
				setHasMore(result.hasMore)
				setStatus('ready')
				inFlight.current = false
			},
			() => {
				// 되돌려 놓아야 재시도가 같은 장을 다시 받는다.
				requested.current = next - 1
				inFlight.current = false
				setStatus('error')
			},
		)
	}, [])

	useEffect(() => {
		if (requested.current === 0) loadNext()
	}, [loadNext])

	// 목록이 늘 때만 다시 묶는다 — 렌더마다 묶으면 스크롤 중에 격자가 통째로 새 객체가 된다.
	const groups = useMemo(() => groupHistoryByDate(items), [items])

	// 아무것도 안 골랐으면 가장 최근 묶음이 자동으로 선택된다(사용자 지시, 2026-09-21).
	// 🔴 한 번만 한다 — 매번 하면 사용자가 고른 묶음을 목록이 늘 때마다 되돌려 버린다.
	const autoSelected = useRef(false)
	const { selectStack } = history
	const firstStack = groups[0]?.stacks[0]
	useEffect(() => {
		if (autoSelected.current || !firstStack) return
		autoSelected.current = true
		selectStack(firstStack.items)
	}, [firstStack, selectStack])

	/**
	 * 격자 끝의 감지선 — 보이면 다음 장을 당긴다.
	 *
	 * 🔴 effect가 아니라 **콜백 ref**다. 감지선은 첫 응답이 온 뒤에야 DOM에 붙으므로 마운트
	 *    시점에 한 번만 관찰하면 영영 걸리지 않는데, 콜백 ref는 그 붙고 떨어지는 순간에 정확히
	 *    불린다. IntersectionObserver가 없는 환경(jsdom)에서는 조용히 넘어가고 목록만 그린다.
	 * ponytail: 한 장(48칸)이 2열 패널을 항상 넘겨서 감지선이 첫 화면에 안 들어온다는 전제다.
	 *    칸을 크게 키우거나 페이지를 줄이면 교차가 안 풀려 다음 장이 안 당겨진다.
	 */
	const sentinel = useCallback(
		(node: HTMLDivElement | null) => {
			observer.current?.disconnect()
			observer.current = null
			if (!node || typeof IntersectionObserver === 'undefined') return
			const next = new IntersectionObserver((entries) => {
				if (entries.some((entry) => entry.isIntersecting)) loadNext()
			})
			next.observe(node)
			observer.current = next
		},
		[loadNext],
	)

	if (status === 'error' && items.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyTitle>생성한 이미지를 불러오지 못했습니다</EmptyTitle>
					<EmptyDescription>
						<Button type="button" variant="outline" onClick={loadNext}>
							다시 시도
						</Button>
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		)
	}

	if (status === 'ready' && items.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyTitle>아직 만들어진 이미지가 없습니다</EmptyTitle>
					<EmptyDescription>
						이미지를 생성하면 여기에 쌓이고, 눌러서 그 설정으로 되돌아올 수 있습니다.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		)
	}

	return (
		<div data-slot="image-history-gallery" className="flex flex-col gap-4 px-3 py-2">
			{groups.map((group) => (
				<section key={group.key} className="flex flex-col gap-2">
					{/* 날짜는 훑는 좌표다 — 스크롤을 따라 머리에 남아 있어야 지금 어디인지 안다. */}
					<Typography
						as="h3"
						size="xs"
						weight="medium"
						className="sticky top-0 z-10 bg-background py-1 text-muted-foreground"
					>
						{group.label}
					</Typography>
					<div className="grid grid-cols-2 gap-3 pr-1 pb-1">
						{group.stacks.map((stack) => (
							<HistoryStackTile
								key={stack.key}
								onSelect={history.selectStack}
								selected={stack.items.some(
									(item) => item.id === history.selectedId,
								)}
								stack={stack}
							/>
						))}
					</div>
				</section>
			))}
			{/* 감지선. 실패했을 때만 사람이 누른다 — 자동 재시도는 같은 실패를 반복한다. */}
			{hasMore && status !== 'error' && (
				<div ref={sentinel} aria-hidden className="h-8 shrink-0" />
			)}
			{status === 'error' && items.length > 0 && (
				<Button type="button" variant="outline" onClick={loadNext}>
					더 불러오지 못했습니다. 다시 시도
				</Button>
			)}
		</div>
	)
}

/**
 * 한 묶음을 겹친 한 장으로 그린다 — 뒤에 깔린 판은 장식이라 `aria-hidden`이고, 누를 수 있는
 * 것은 맨 위 한 장뿐이다(사용자 지시, 2026-09-21).
 *
 * 🔑 묶음 안의 장들은 프롬프트·비율·해상도·프로파일이 모두 같으므로, 어느 장을 복원하든
 *    컨트롤러 결과가 같다. 그래서 「어느 장을 고를까」를 묻지 않고 맨 앞 장으로 되돌린다.
 */
function HistoryStackTile({
	onSelect,
	selected,
	stack,
}: {
	onSelect: (items: readonly GeneratedImageHistoryItem[]) => void
	selected: boolean
	stack: GeneratedImageHistoryStack
}) {
	const [top] = stack.items
	if (!top) return null
	const count = stack.items.length
	const label = top.prompt ?? top.profileName ?? '생성 이미지'

	return (
		<div className="relative">
			{/* 뒤로 깔리는 판. 장수만큼이 아니라 최대 두 겹까지만 — 그 이상은 두께가 안 읽힌다. */}
			{count > 2 && (
				<div
					aria-hidden
					className="absolute inset-0 translate-x-1 translate-y-1 rounded-md border border-border bg-muted"
				/>
			)}
			{count > 1 && (
				<div
					aria-hidden
					className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-md border border-border bg-muted"
				/>
			)}
			<button
				type="button"
				onClick={() => onSelect(stack.items)}
				title={top.prompt ?? undefined}
				// 지금 캔버스에 올라와 있는 묶음임을 색만이 아니라 상태로도 알린다.
				aria-current={selected || undefined}
				aria-label={count > 1 ? `${label} 외 ${count - 1}장` : label}
				className={cn(
					'relative block w-full overflow-hidden rounded-md border bg-muted outline-none',
					'focus-visible:ring-2 focus-visible:ring-ring',
					selected ? 'border-2 border-ring' : 'border-border hover:border-ring',
				)}
			>
				{/* 비율이 섞여 있어 정사각 칸에 채워 자른다 — 격자가 흔들리면 훑을 수 없다. */}
				{/* biome-ignore lint/performance/noImgElement: 썸네일, 최적화 불필요 */}
				<img
					src={top.url}
					alt={label}
					loading="lazy"
					className="aspect-square w-full object-cover"
				/>
				{count > 1 && (
					<span className="absolute top-1 right-1 rounded-sm bg-background/80 px-1 font-medium text-foreground text-xs">
						{count}
					</span>
				)}
			</button>
		</div>
	)
}
