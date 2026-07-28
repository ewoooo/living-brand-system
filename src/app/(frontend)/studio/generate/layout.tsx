import type React from 'react'
import { SectionLayout } from '@/components/global/section-layout'
import { StudioSideNavigation } from '@/components/global/studio-side-navigation'
import { getCreateNavigation } from '@/features/asset-generation/services/get-create-navigation.service'

// Studio 사이드바의 발행 템플릿을 요청 시점에 표시한다.
export const dynamic = 'force-dynamic'

export default async function GenerateLayout({ children }: { children: React.ReactNode }) {
	const navigation = await getCreateNavigation()

	return (
		<SectionLayout nav={<StudioSideNavigation navigation={navigation} />}>
			{children}
		</SectionLayout>
	)
}
