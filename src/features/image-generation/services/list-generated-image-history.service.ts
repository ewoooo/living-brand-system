import type { GeneratedImageHistoryItem } from '@/features/image-generation/domain/generated-image-history'
import { listGeneratedImageHistory } from '@/features/image-generation/repositories/generated-image.payload.repository'

/** 한 번에 내리는 장수. 좌측 패널 폭에서 여러 줄이 차되 첫 페인트를 끌지 않는 크기다. */
export const GENERATED_IMAGE_HISTORY_PAGE_SIZE = 48

/**
 * 유스케이스 경계: 좌측 갤러리가 그릴 생성 이미지 목록을 최신순 한 페이지로 만든다.
 * 페이지 경계 보정은 이 서비스가 소유하고, Payload 조회는 repository가 소유한다.
 */
export async function listGeneratedImageHistoryPage(input: {
	page: number
	user: unknown
}): Promise<{ items: GeneratedImageHistoryItem[]; hasMore: boolean }> {
	// 쿼리스트링에서 온 값이라 정수·하한을 여기서 못박는다 — 음수 page는 Payload가 1로 뭉개지 않는다.
	const page = Number.isInteger(input.page) && input.page > 0 ? input.page : 1
	return listGeneratedImageHistory({
		limit: GENERATED_IMAGE_HISTORY_PAGE_SIZE,
		page,
		user: input.user,
	})
}
