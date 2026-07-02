import type React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { CreateSideNavigation } from '@/features/asset-generation/components/create-side-navigation'
import { getCreateNavigation } from '@/features/asset-generation/services/get-create-navigation.service'

// 발행 직후의 템플릿이 재빌드 없이 보이도록 요청 시점에 렌더한다.
export const dynamic = 'force-dynamic'

export default async function CreateLayout({ children }: { children: React.ReactNode }) {
	const navigation = await getCreateNavigation()

	return (
		<SidebarProvider className="min-h-full">
			<CreateSideNavigation navigation={navigation} />
			<div className="flex min-w-0 flex-1 flex-col items-center">
				<main className="flex min-h-svh w-full flex-1 justify-center px-4 md:px-12">
					{children}
				</main>
			</div>
		</SidebarProvider>
	)
}
