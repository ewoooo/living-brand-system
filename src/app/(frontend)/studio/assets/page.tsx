import { requireUser } from '@/lib/request-auth'
import { routes } from '@/lib/routes'

// 렌더링: 매 요청. 회원 게이트가 세션을 읽으므로 캐시하지 않는다.
export const dynamic = 'force-dynamic'

export default async function StudioAssetsPage() {
	await requireUser(routes.studio.assets)
	return null
}
