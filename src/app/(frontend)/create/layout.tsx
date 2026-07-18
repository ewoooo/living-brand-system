import type React from 'react'
import { ContentFrame } from '@/components/global/content-frame'
import { SectionLayout } from '@/components/global/section-layout'
import { StudioSideNavigation } from '@/components/global/studio-side-navigation'
import { PageNavigation } from '@/components/page-navigation'
import { getCreateNavigation } from '@/features/asset-generation/services/get-create-navigation.service'

// 발행 직후의 템플릿이 재빌드 없이 보이도록 요청 시점에 렌더한다.
export const dynamic = 'force-dynamic'

export default async function CreateLayout({ children }: { children: React.ReactNode }) {
	const navigation = await getCreateNavigation()

	return (
		<SectionLayout
			nav={<StudioSideNavigation navigation={navigation} />}
			pageNavigation={
				<PageNavigation
					items={[
						{ title: '제작', href: '/create' },
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
			<ContentFrame className="py-10">{children}</ContentFrame>
		</SectionLayout>
	)
}
