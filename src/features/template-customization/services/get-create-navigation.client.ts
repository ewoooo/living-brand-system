import type { GetCreateNavigationOutput } from '@/features/template-customization/services/get-create-navigation.service'

/**
 * 템플릿 목록 클라이언트 서비스 — 브라우저에서 GET /api/templates 호출의 계약을 소유한다.
 * 자산 브라우저가 열릴 때 한 번 호출된다. 실패는 던져서 호출자가 재시도 안내를 그리게 한다.
 */
export async function fetchCreateNavigation(): Promise<GetCreateNavigationOutput['categories']> {
	const response = await fetch('/api/templates')
	if (!response.ok) throw new Error('템플릿 목록을 불러오지 못했습니다.')
	const data = (await response.json()) as Partial<GetCreateNavigationOutput>
	return data.categories ?? []
}
