import type { PayloadRequest } from 'payload'

/** 갤러리로 다루는 브랜드 이미지 업로드 컬렉션 slug. */
export type BrandImageCollectionSlug = 'application-images' | 'brand-logos'

/** Admin 갤러리 뷰가 소비하는 정규화된 브랜드 이미지 자산. */
export interface BrandImageAsset {
	id: number
	name: string
	alt: string
	/** 그리드 썸네일 URL. sizes.thumbnail → thumbnailURL → 원본 url 순으로 선택한다. */
	thumbnailURL: string | null
	/** 원본 이미지 URL. 편집 링크 외 원본 참조가 필요할 때 사용한다. */
	url: string | null
	status: 'draft' | 'published'
	updatedAt: string
}

/** 한 페이지 분량의 자산과 페이지네이션 메타데이터. */
export interface BrandImagePage {
	assets: BrandImageAsset[]
	/** 현재 페이지 번호(1부터). */
	page: number
	/** 전체 페이지 수. */
	totalPages: number
	/** 전체 문서 수. */
	totalDocs: number
}

/** Payload upload 문서에서 갤러리에 필요한 필드만 좁힌 형태. */
type BrandImageUploadDoc = {
	id: number
	name: string
	alt: string
	url?: string | null
	thumbnailURL?: string | null
	sizes?: { thumbnail?: { url?: string | null } | null } | null
	_status?: ('draft' | 'published') | null
	updatedAt: string
}

/**
 * 지정한 브랜드 이미지 컬렉션 문서를 접근 제어 아래에서 한 페이지씩 읽고 갤러리용으로 정규화한다.
 * draft 포함 조회·페이지네이션과 Payload 변환 I/O는 이 repository가 소유한다.
 */
export async function listBrandImageAssets(
	payload: PayloadRequest['payload'],
	{
		collectionSlug,
		limit,
		locale,
		page,
		user,
	}: {
		collectionSlug: BrandImageCollectionSlug
		/** 페이지당 항목 수. */
		limit: number
		locale?: 'en' | 'ko'
		/** 조회할 페이지 번호(1부터). */
		page: number
		user: Parameters<PayloadRequest['payload']['find']>[0]['user']
	},
): Promise<BrandImagePage> {
	const result = await payload.find({
		collection: collectionSlug,
		depth: 0,
		draft: true,
		limit,
		locale,
		overrideAccess: false,
		page,
		sort: '-updatedAt',
		user,
	})

	return {
		assets: (result.docs as BrandImageUploadDoc[]).map((doc) => ({
			id: doc.id,
			name: doc.name,
			alt: doc.alt,
			thumbnailURL: doc.sizes?.thumbnail?.url ?? doc.thumbnailURL ?? doc.url ?? null,
			url: doc.url ?? null,
			status: doc._status === 'published' ? 'published' : 'draft',
			updatedAt: doc.updatedAt,
		})),
		page: result.page ?? page,
		totalPages: result.totalPages,
		totalDocs: result.totalDocs,
	}
}
