import { getCreateNavigation } from '@/features/template-customization/services/get-create-navigation.service'
import { authenticateRequest, isCrossOriginRequest } from '@/lib/request-auth'

// 렌더링: 매 요청. 발행 상태가 바뀌면 즉시 반영되어야 하므로 캐시하지 않는다.
export const dynamic = 'force-dynamic'

/**
 * 자산 브라우저가 열릴 때 카테고리별 published 템플릿 목록을 내려준다.
 * 로그인을 요구하지 않는다 — 템플릿 화면 자체가 비로그인에서 열리므로 여기서 더 좁히면 화면과 어긋난다.
 * 🔴 주소는 화면(`/studio/template`)과 같은 모양을 쓴다. 컬렉션 이름(`/api/templates`)을 쓰면
 *    Payload가 같은 자리에 여는 컬렉션 REST를 통째로 가려 버린다.
 */
export async function GET(request: Request) {
	if (isCrossOriginRequest(request)) {
		return Response.json({ message: 'Invalid origin.' }, { status: 403 })
	}

	const { payload } = await authenticateRequest()

	try {
		return Response.json(await getCreateNavigation())
	} catch (error) {
		payload.logger.error({ err: error }, 'studio-template-list.failed')
		return Response.json({ message: 'Failed to load templates.' }, { status: 500 })
	}
}
