import { redirect } from 'next/navigation'
import { SectionLayout } from '@/components/global/section-layout'
import { McpKeyIssuer } from '@/components/settings/mcp-key-issuer'
import { ContentFrame } from '@/components/shared/content-frame'
import { ContentHeading } from '@/components/shared/content-heading'
import { StudioSideNavigation } from '@/components/studio/shared/studio-side-navigation'
import { authenticateRequest } from '@/lib/request-auth'
import { routes } from '@/lib/routes'

export default async function StudioMcpPage() {
	const { user } = await authenticateRequest()
	if (!user) {
		redirect(`/admin/login?redirect=${encodeURIComponent(routes.studio.mcp)}`)
	}

	return (
		<SectionLayout nav={<StudioSideNavigation />} mobileNavigation={false}>
			<ContentFrame className="grid gap-8 py-10">
				<ContentHeading
					title="MCP 설정"
					description="로그인 계정을 외부 도구와 연결합니다."
				/>
				<McpKeyIssuer />
			</ContentFrame>
		</SectionLayout>
	)
}
