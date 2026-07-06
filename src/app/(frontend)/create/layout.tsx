import type React from 'react'
import { SectionLayout } from '@/components/section-layout'
import { CreateSideNavigation } from '@/features/asset-generation/components/create-side-navigation'
import { getCreateNavigation } from '@/features/asset-generation/services/get-create-navigation.service'

// 발행 직후의 템플릿이 재빌드 없이 보이도록 요청 시점에 렌더한다.
export const dynamic = 'force-dynamic'

export default async function CreateLayout({ children }: { children: React.ReactNode }) {
	const navigation = await getCreateNavigation()

	return (
		<SectionLayout nav={<CreateSideNavigation navigation={navigation} />}>
			{children}
		</SectionLayout>
	)
}
