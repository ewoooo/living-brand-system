import type { TemplateVectorAssetCollection } from '@/features/template-core/domain/template-asset-policy'
import type { ApplicationImage, BrandColor, BrandLogo } from '@/payload-types'

export type TemplateVectorAsset = (BrandLogo | ApplicationImage) & {
	collection: TemplateVectorAssetCollection
}

const PUBLISHED_QUERY = 'depth=0&limit=100&where[_status][equals]=published&sort=name'

async function requestPublishedDocs<T>(path: string, signal: AbortSignal): Promise<T[]> {
	const response = await fetch(`/api/${path}?${PUBLISHED_QUERY}`, { signal })
	if (!response.ok) throw new Error('Failed to load template editor options')
	const body = (await response.json()) as { docs?: T[] }
	return Array.isArray(body.docs) ? body.docs : []
}

/** Admin 템플릿 편집기의 브랜드 컬러 선택지를 읽는다. Payload REST I/O는 이 client service가 소유한다. */
export function requestPublishedBrandColors(signal: AbortSignal): Promise<BrandColor[]> {
	return requestPublishedDocs<BrandColor>('brand-colors', signal)
}

/** Admin 템플릿 벡터 편집기의 허용 자산을 읽는다. Payload REST I/O는 이 client service가 소유한다. */
export async function requestPublishedTemplateVectorAssets(
	signal: AbortSignal,
): Promise<TemplateVectorAsset[]> {
	const [logos, images] = await Promise.all([
		requestPublishedDocs<BrandLogo>('brand-logos', signal),
		requestPublishedDocs<ApplicationImage>('application-images', signal),
	])
	return [
		...logos.map((asset) => ({ ...asset, collection: 'brand-logos' as const })),
		...images.map((asset) => ({ ...asset, collection: 'application-images' as const })),
	]
}
