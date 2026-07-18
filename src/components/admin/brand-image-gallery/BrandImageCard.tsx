import Link from 'next/link'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { BrandImageAsset } from '@/features/brand-resource/services/list-brand-image-assets.service'

/**
 * 단일 브랜드 이미지 카드 — 순수 표현 컴포넌트(데이터 조회 없음).
 *
 * Props
 * - `asset`: 표시할 정규화된 자산
 * - `editURL`: 카드 클릭 시 이동할 Admin 편집 경로(라우팅 지식은 상위가 소유)
 * - `objectFit`: 썸네일 맞춤 방식(로고=contain, 이미지=cover)
 */
export function BrandImageCard({
	asset,
	editURL,
	objectFit,
}: {
	asset: BrandImageAsset
	editURL: string
	objectFit: 'contain' | 'cover'
}) {
	return (
		<Link href={editURL} className="group/brand-image-card block">
			<Card
				size="sm"
				// text-sm: shadcn Card 기본 text-xs를 이 갤러리 카드에서만 키운다.
				className="h-full gap-2 py-0 pb-3 text-sm transition group-hover/brand-image-card:ring-foreground/25"
			>
				<AspectRatio ratio={4 / 3} className="overflow-hidden rounded-t-lg bg-muted">
					{asset.thumbnailURL ? (
						// biome-ignore lint/performance/noImgElement: Admin 전용 뷰라 next/image 최적화가 불필요하다.
						<img
							src={asset.thumbnailURL}
							alt={asset.alt}
							className={
								objectFit === 'cover'
									? 'size-full object-cover'
									: 'size-full object-contain p-3'
							}
						/>
					) : (
						<div className="flex size-full items-center justify-center text-muted-foreground">
							미리보기 없음
						</div>
					)}
				</AspectRatio>
				<CardContent className="flex items-start justify-between gap-2">
					<span className="truncate font-medium" title={asset.name}>
						{asset.name}
					</span>
					<Badge variant={asset.status === 'published' ? 'default' : 'secondary'}>
						{asset.status === 'published' ? '발행됨' : '초안'}
					</Badge>
				</CardContent>
			</Card>
		</Link>
	)
}
