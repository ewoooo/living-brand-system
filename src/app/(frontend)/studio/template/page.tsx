import { redirect } from 'next/navigation'
import { StudioWorkspacePage } from '@/components/studio/studio-workspace'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { getCreateNavigation } from '@/services/get-create-navigation.service'

export default async function CreatePage() {
	const navigation = await getCreateNavigation()
	const firstTemplate = navigation.categories.flatMap((category) => category.templates)[0]

	if (firstTemplate) {
		redirect(firstTemplate.href)
	}

	return (
		<StudioWorkspacePage
			title="템플릿 제작"
			description="발행된 템플릿을 선택해 브랜드 산출물을 만듭니다."
		>
			<Empty className="min-h-96 rounded-none border-t border-border">
				<EmptyHeader>
					<EmptyTitle>발행된 템플릿이 없습니다</EmptyTitle>
					<EmptyDescription>
						템플릿이 발행되면 이 화면에서 바로 편집하고 내보낼 수 있습니다.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</StudioWorkspacePage>
	)
}
