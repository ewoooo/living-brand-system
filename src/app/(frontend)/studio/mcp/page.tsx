import { redirect } from 'next/navigation'
import { ContentFrame } from '@/components/shared/content-frame'
import { ContentHeading } from '@/components/shared/content-heading'
import { McpKeyIssuer } from '@/components/studio/mcp/mcp-key-issuer'
import { authenticateRequest } from '@/lib/request-auth'
import { routes } from '@/lib/routes'

// 렌더링: 매 요청. 권한·미리보기 상태를 읽으므로 캐시하지 않는다.
// 🔴 방식을 선언으로 못박는다 — 추론에 맡기면 프로덕션에서만 드러나는 차이가 생긴다
//    (docs/05 「렌더링 캐시 무효화」).
export const dynamic = 'force-dynamic'

export default async function StudioMcpPage() {
	const { user } = await authenticateRequest()
	if (!user) {
		redirect(`/admin/login?redirect=${encodeURIComponent(routes.studio.mcp)}`)
	}

	return (
		<ContentFrame className="grid gap-8 py-10">
			<ContentHeading title="MCP 설정" description="로그인 계정을 외부 도구와 연결합니다." />
			{/* 폭은 화면 조합(페이지)이 소유한다 — docs/10 §4. */}
			<div className="max-w-2xl">
				<McpKeyIssuer />
			</div>
		</ContentFrame>
	)
}
