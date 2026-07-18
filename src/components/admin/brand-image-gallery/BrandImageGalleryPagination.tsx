import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination'

/** 현재 페이지 좌우로 노출할 페이지 수. 나머지는 생략(...) 처리한다. */
const PAGE_WINDOW = 1

/**
 * 페이지 번호 토큰 목록을 만든다.
 * 항상 첫/마지막 페이지와 현재 페이지 주변(PAGE_WINDOW)만 노출하고, 사이는 'ellipsis'로 접는다.
 */
function buildPageItems(current: number, total: number): (number | 'ellipsis')[] {
	const items: (number | 'ellipsis')[] = []
	for (let page = 1; page <= total; page++) {
		const isEdge = page === 1 || page === total
		const isNearCurrent = Math.abs(page - current) <= PAGE_WINDOW
		if (isEdge || isNearCurrent) {
			items.push(page)
		} else if (items[items.length - 1] !== 'ellipsis') {
			items.push('ellipsis')
		}
	}
	return items
}

/**
 * shadcn Pagination 기반 갤러리 페이저 — 순수 표현 컴포넌트(데이터 조회 없음).
 *
 * Props
 * - `currentPage`: 현재 페이지(1부터)
 * - `totalPages`: 전체 페이지 수
 * - `buildPageURL`: 페이지 번호 → 이동 URL 매퍼(쿼리 보존 등 라우팅 지식은 상위가 소유)
 */
export function BrandImageGalleryPagination({
	buildPageURL,
	currentPage,
	totalPages,
}: {
	buildPageURL: (page: number) => string
	currentPage: number
	totalPages: number
}) {
	const items = buildPageItems(currentPage, totalPages)
	const hasPrevious = currentPage > 1
	const hasNext = currentPage < totalPages

	return (
		<Pagination>
			<PaginationContent className="list-none">
				{hasPrevious && (
					<PaginationItem>
						<PaginationPrevious href={buildPageURL(currentPage - 1)} text="이전" />
					</PaginationItem>
				)}

				{items.map((item, index) =>
					item === 'ellipsis' ? (
						// biome-ignore lint/suspicious/noArrayIndexKey: 생략 토큰은 순서가 고정이라 index로 충분하다.
						<PaginationItem key={`ellipsis-${index}`}>
							<PaginationEllipsis />
						</PaginationItem>
					) : (
						<PaginationItem key={item}>
							<PaginationLink
								href={buildPageURL(item)}
								isActive={item === currentPage}
							>
								{item}
							</PaginationLink>
						</PaginationItem>
					),
				)}

				{hasNext && (
					<PaginationItem>
						<PaginationNext href={buildPageURL(currentPage + 1)} text="다음" />
					</PaginationItem>
				)}
			</PaginationContent>
		</Pagination>
	)
}
