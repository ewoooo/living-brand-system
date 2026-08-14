import { notFound } from 'next/navigation'
import { StudioWorkspacePage } from '@/components/studio/shared/studio-workspace'
import { TemplateGenerator } from '@/components/studio/template/template-generator'
import { getCreateNavigation } from '@/features/template-customization/services/get-create-navigation.service'
import { getTemplateStudio } from '@/features/template-customization/services/get-template-studio.service'
import { authenticateRequest } from '@/lib/request-auth'

export default async function CreateTemplatePage({
	params,
}: {
	params: Promise<{ categorySlug: string; templateId: string }>
}) {
	const { templateId } = await params
	const parsedId = Number(templateId)

	if (!Number.isInteger(parsedId)) {
		notFound()
	}

	const { user } = await authenticateRequest()
	const [navigation, studio] = await Promise.all([
		getCreateNavigation(),
		getTemplateStudio(parsedId, user),
	])

	if (!studio) {
		notFound()
	}

	return (
		<StudioWorkspacePage
			title={studio.template.name}
			description="열린 슬롯을 편집하고 미리보기를 확인한 뒤 원하는 형식으로 내보냅니다."
			hideHeading
		>
			<TemplateGenerator
				key={studio.template.id}
				config={studio.config}
				navigation={navigation}
				template={studio.template}
			/>
		</StudioWorkspacePage>
	)
}
