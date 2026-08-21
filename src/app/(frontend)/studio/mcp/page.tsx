import { McpKeyIssuer } from '@/components/studio/mcp/mcp-key-issuer'
import { StudioWorkspacePage } from '@/components/studio/shared/studio-workspace'
import { requireUser } from '@/lib/request-auth'
import { routes } from '@/lib/routes'

// 렌더링: 매 요청. 권한·미리보기 상태를 읽으므로 캐시하지 않는다.
// 🔴 방식을 선언으로 못박는다 — 추론에 맡기면 프로덕션에서만 드러나는 차이가 생긴다
//    (docs/05 「렌더링 캐시 무효화」).
export const dynamic = 'force-dynamic'

export default async function StudioMcpPage() {
	await requireUser(routes.studio.mcp)

	return (
		// 제목이 카드 안으로 들어간 화면이라 페이지 헤딩은 스크린리더 전용으로 남긴다(디자인 64:2).
		<StudioWorkspacePage
			description="로그인 계정을 외부 도구와 연결합니다."
			hideHeading
			title="MCP 설정"
		>
			<div className="grid h-full place-items-center p-4 md:p-6">
				{/* 폭은 화면 조합(페이지)이 소유한다 — docs/10 §4. 디자인의 672px = max-w-2xl. */}
				<div className="w-full max-w-2xl">
					<McpKeyIssuer />
				</div>
			</div>
		</StudioWorkspacePage>
	)
}
