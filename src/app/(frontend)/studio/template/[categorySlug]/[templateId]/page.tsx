import { notFound } from 'next/navigation'
import { StudioWorkspacePage } from '@/components/studio/shared/studio-workspace'
import { TemplateGenerator } from '@/components/studio/template/template-generator'
import { getCreateNavigation } from '@/services/get-create-navigation.service'
import { getPublishedTemplate } from '@/services/get-published-template.service'

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

	const [navigation, template] = await Promise.all([
		getCreateNavigation(),
		getPublishedTemplate(parsedId),
	])

	if (!template) {
		notFound()
	}

	return (
		<StudioWorkspacePage
			title={template.name}
			description="열린 슬롯을 편집하고 미리보기를 확인한 뒤 원하는 형식으로 내보냅니다."
		>
			<TemplateGenerator key={template.id} navigation={navigation} template={template} />
		</StudioWorkspacePage>
	)
}
