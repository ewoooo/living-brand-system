import type React from 'react'
import { SectionLayout } from '@/components/global/section-layout'
import { PageNavigation } from '@/components/shared/navigation/page-navigation'
import { StudioSideNavigation } from '@/components/studio/shared/studio-side-navigation'
import { getCreateNavigation } from '@/features/template-create/services/get-create-navigation.service'
import { routes } from '@/lib/routes'

// 발행 직후의 템플릿이 재빌드 없이 보이도록 요청 시점에 렌더한다.
export const dynamic = 'force-dynamic'

export default async function CreateLayout({ children }: { children: React.ReactNode }) {
	const navigation = await getCreateNavigation()

	return (
		<SectionLayout
			nav={<StudioSideNavigation />}
			mobileNavigation={false}
			pageNavigation={
				<PageNavigation
					items={[
						{ title: '제작', href: routes.studio.template },
						...navigation.categories.flatMap((category) => [
							{ title: category.title, href: category.href },
							...category.templates.map((template) => ({
								title: template.name,
								href: template.href,
							})),
						]),
					]}
				/>
			}
		>
			{children}
		</SectionLayout>
	)
}
