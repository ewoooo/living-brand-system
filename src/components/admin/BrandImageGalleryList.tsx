import { Gutter } from '@payloadcms/ui'
import type { ListViewServerProps } from 'payload'
import { formatAdminURL } from 'payload/shared'
import {
	type BrandImageCollectionSlug,
	listBrandImageAssets,
} from '@/features/brand-resource/services/list-brand-image-assets.service'
import { BrandImageGallery } from './brand-image-gallery/BrandImageGallery'

// 컬렉션별 표시 차이는 slug로 분기한다(공용 컴포넌트가 두 컬렉션을 모두 처리).
const titleBySlug: Record<BrandImageCollectionSlug, string> = {
	'application-images': '브랜드 이미지',
	'brand-logos': '로고',
}

// 로고는 원본 비율 유지(contain), 이미지는 카드에 꽉 채움(cover).
const objectFitBySlug: Record<BrandImageCollectionSlug, 'contain' | 'cover'> = {
	'application-images': 'cover',
	'brand-logos': 'contain',
}

function isBrandImageCollectionSlug(slug: string): slug is BrandImageCollectionSlug {
	return slug === 'application-images' || slug === 'brand-logos'
}

// 페이지당 항목 수. 2·3·4·5열 그리드에 고르게 나뉘도록 잡았다.
const PAGE_SIZE = 24

/** searchParams의 page 값을 1 이상의 정수로 정규화한다(잘못된 값은 1페이지). */
function resolvePage(raw: string | string[] | undefined): number {
	const value = Number(Array.isArray(raw) ? raw[0] : raw)
	return Number.isInteger(value) && value > 0 ? value : 1
}

/**
 * application-images와 brand-logos 공용 Admin List 갤러리 뷰.
 * collectionConfig.slug로 대상 컬렉션을 판별해 하나의 컴포넌트가 두 컬렉션을 모두 처리한다.
 * 데이터 조회·페이지네이션은 service, 표현은 BrandImageGallery가 담당하고, 이 진입 뷰는 둘을 연결한다.
 */
export default async function BrandImageGalleryList({
	collectionConfig,
	hasCreatePermission,
	locale,
	newDocumentURL,
	payload,
	searchParams,
	user,
}: ListViewServerProps) {
	const slug = collectionConfig.slug
	// 등록되지 않은 컬렉션에서 잘못 참조되면 안전하게 렌더링을 중단한다(런타임 방어).
	if (!isBrandImageCollectionSlug(slug)) return null

	const activeLocale = locale?.code === 'ko' || locale?.code === 'en' ? locale.code : undefined
	const page = resolvePage(searchParams?.page)
	const result = await listBrandImageAssets(payload, {
		collectionSlug: slug,
		limit: PAGE_SIZE,
		locale: activeLocale,
		page,
		user,
	})
	const adminRoute = payload.config.routes.admin
	const listPath = formatAdminURL({ adminRoute, path: `/collections/${slug}` })

	// 기존 쿼리(로케일 등)를 보존한 채 page만 바꾼 목록 URL을 만든다.
	const buildPageURL = (targetPage: number) => {
		const params = new URLSearchParams()
		for (const [key, value] of Object.entries(searchParams ?? {})) {
			if (key === 'page' || value == null) continue
			if (Array.isArray(value)) {
				for (const entry of value) params.append(key, entry)
			} else {
				params.set(key, value)
			}
		}
		params.set('page', String(targetPage))
		return `${listPath}?${params.toString()}`
	}

	return (
		<div className={`collection-list collection-list--${slug}`}>
			<Gutter>
				<BrandImageGallery
					assets={result.assets}
					buildEditURL={(id) =>
						formatAdminURL({ adminRoute, path: `/collections/${slug}/${id}` })
					}
					buildPageURL={buildPageURL}
					canCreate={hasCreatePermission}
					currentPage={result.page}
					description="썸네일을 클릭하면 편집 화면으로 이동합니다."
					newDocumentURL={newDocumentURL}
					objectFit={objectFitBySlug[slug]}
					title={titleBySlug[slug]}
					totalCount={result.totalDocs}
					totalPages={result.totalPages}
				/>
			</Gutter>
		</div>
	)
}
