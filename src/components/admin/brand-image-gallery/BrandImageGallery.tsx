import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import type { BrandImageAsset } from '@/features/brand-resource/services/list-brand-image-assets.service'
import { BrandImageCard } from './BrandImageCard'
import { BrandImageGalleryPagination } from './BrandImageGalleryPagination'

/**
 * 브랜드 이미지 갤러리 표현 계층(그리드 셸) — 순수 표현 컴포넌트(데이터 조회 없음).
 *
 * Props
 * - `title`/`description`: 헤더 문구
 * - `assets`: 현재 페이지에 표시할 자산 목록
 * - `totalCount`: 전체 자산 수(헤더 카운트용)
 * - `objectFit`: 카드 썸네일 맞춤 방식(컬렉션별로 상위가 결정)
 * - `buildEditURL`: 자산 id → Admin 편집 URL 매퍼(라우팅 지식은 상위 진입 뷰가 소유)
 * - `currentPage`/`totalPages`/`buildPageURL`: 페이지네이션 상태와 URL 매퍼
 * - `newDocumentURL`/`canCreate`: "새 항목" 버튼 노출 제어
 */
export function BrandImageGallery({
	assets,
	buildEditURL,
	buildPageURL,
	canCreate,
	currentPage,
	description,
	newDocumentURL,
	objectFit,
	title,
	totalCount,
	totalPages,
}: {
	assets: BrandImageAsset[]
	buildEditURL: (id: number) => string
	buildPageURL: (page: number) => string
	canCreate: boolean
	currentPage: number
	description: string
	newDocumentURL: string
	objectFit: 'contain' | 'cover'
	title: string
	totalCount: number
	totalPages: number
}) {
	return (
		<div className="flex flex-col gap-6">
			<header className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-lg font-semibold">
						{title} <span className="text-muted-foreground">({totalCount})</span>
					</h1>
					<p className="text-sm text-muted-foreground">{description}</p>
				</div>
				{canCreate && (
					<Button asChild>
						<Link href={newDocumentURL}>새 항목</Link>
					</Button>
				)}
			</header>

			{assets.length > 0 ? (
				<>
					<ul className="grid list-none grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{assets.map((asset) => (
							<li key={asset.id}>
								<BrandImageCard
									asset={asset}
									editURL={buildEditURL(asset.id)}
									objectFit={objectFit}
								/>
							</li>
						))}
					</ul>

					{totalPages > 1 && (
						<BrandImageGalleryPagination
							buildPageURL={buildPageURL}
							currentPage={currentPage}
							totalPages={totalPages}
						/>
					)}
				</>
			) : (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>등록된 이미지가 없습니다.</EmptyTitle>
					</EmptyHeader>
				</Empty>
			)}
		</div>
	)
}
