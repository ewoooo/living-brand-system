'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Typography } from '@/components/ui/typography'
import {
	acceptsHistoryRestore,
	type GeneratedImageHistoryItem,
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
	const { applyHistoryItem } = useImageStudio()
	const [items, setItems] = useState<GeneratedImageHistoryItem[]>([])
	const [page, setPage] = useState(1)
	const [hasMore, setHasMore] = useState(false)
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
	// StrictMode의 이중 호출과 연타를 함께 막는다 — state로 막으면 둘 다 새는 창이 있다.
	const requested = useRef(0)

	const loadPage = useCallback((next: number) => {
		if (requested.current >= next) return
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
				setPage(next)
				setStatus('ready')
			},
			() => {
				requested.current = next - 1
				setStatus('error')
			},
		)
	}, [])

	useEffect(() => {
		loadPage(1)
	}, [loadPage])

	if (status === 'error' && items.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyTitle>생성한 이미지를 불러오지 못했습니다</EmptyTitle>
					<EmptyDescription>
						<Button type="button" variant="outline" onClick={() => loadPage(1)}>
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
		<div data-slot="image-history-gallery" className="flex flex-col gap-3 px-3 py-2">
			<div className="grid grid-cols-2 gap-2">
				{items.map((item) => {
					const restorable = acceptsHistoryRestore(item)
					return (
						<button
							key={item.id}
							type="button"
							disabled={!restorable}
							onClick={() => applyHistoryItem(item)}
							title={item.prompt ?? undefined}
							className={cn(
								'overflow-hidden rounded-md border border-border bg-muted outline-none',
								restorable
									? 'hover:border-ring focus-visible:ring-2 focus-visible:ring-ring'
									: 'cursor-default opacity-60',
							)}
						>
							{/* 비율이 섞여 있어 정사각 칸에 채워 자른다 — 격자가 흔들리면 훑을 수 없다. */}
							{/* biome-ignore lint/performance/noImgElement: 썸네일, 최적화 불필요 */}
							<img
								src={item.url}
								alt={item.prompt ?? item.profileName ?? '생성 이미지'}
								loading="lazy"
								className="aspect-square w-full object-cover"
							/>
						</button>
					)
				})}
			</div>
			{hasMore && (
				<Button
					type="button"
					variant="outline"
					disabled={status === 'loading'}
					onClick={() => loadPage(page + 1)}
				>
					{status === 'loading' ? '불러오는 중…' : '더 보기'}
				</Button>
			)}
			{status === 'error' && items.length > 0 && (
				<Typography as="p" size="xs" className="text-muted-foreground">
					더 불러오지 못했습니다. 다시 눌러 주세요.
				</Typography>
			)}
		</div>
	)
}
