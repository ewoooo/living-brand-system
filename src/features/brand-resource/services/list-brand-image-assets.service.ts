import type { PayloadRequest } from 'payload'
import {
	type BrandImageAsset,
	type BrandImageCollectionSlug,
	type BrandImagePage,
	listBrandImageAssets as listBrandImageAssetRecords,
} from '../repositories/brand-image.payload.repository'

// 상위(Admin 뷰) 계층이 repository를 직접 알지 않도록 뷰 모델 타입을 서비스에서 재노출한다.
export type { BrandImageAsset, BrandImageCollectionSlug, BrandImagePage }

/**
 * Payload Admin 갤러리 뷰에 브랜드 이미지 자산을 페이지 단위로 제공한다.
 * 접근 제어가 적용된 draft 포함 조회·페이지네이션과 Payload 변환 I/O는 brand-image repository가 소유한다.
 */
export async function listBrandImageAssets(
	payload: PayloadRequest['payload'],
	input: {
		collectionSlug: BrandImageCollectionSlug
		limit: number
		locale?: 'en' | 'ko'
		page: number
		user: Parameters<PayloadRequest['payload']['find']>[0]['user']
	},
): Promise<BrandImagePage> {
	return listBrandImageAssetRecords(payload, input)
}
