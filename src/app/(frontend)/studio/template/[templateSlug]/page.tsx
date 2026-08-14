import { notFound } from 'next/navigation'
import { StudioWorkspacePage } from '@/components/studio/shared/studio-workspace'
import { TemplateGenerator } from '@/components/studio/template/template-generator'
import { listGraphicStudioConfigs } from '@/features/graphic-generation/services/list-graphic-studio-configs.service'
import { listImageStudioConfigs } from '@/features/image-generation/services/list-image-studio-configs.service'
import { deriveTemplateConfig } from '@/features/template-customization/domain/template-config'
import { getCreateNavigation } from '@/features/template-customization/services/get-create-navigation.service'
import { getPublishedTemplate } from '@/features/template-customization/services/get-published-template.service'
import { authenticateRequest } from '@/lib/request-auth'

export default async function CreateTemplatePage({
	params,
}: {
	params: Promise<{ templateSlug: string }>
}) {
	const { templateSlug } = await params
	const { user } = await authenticateRequest()
	const [navigation, template, imageConfigs, graphicConfigs] = await Promise.all([
		getCreateNavigation(),
		getPublishedTemplate(templateSlug),
		user ? listImageStudioConfigs(user) : [],
		user ? listGraphicStudioConfigs(user) : [],
	])

	if (!template) {
		notFound()
	}
	const config = deriveTemplateConfig(template, imageConfigs, graphicConfigs)

	return (
		<StudioWorkspacePage
			title={template.name}
			description="열린 슬롯을 편집하고 미리보기를 확인한 뒤 원하는 형식으로 내보냅니다."
			hideHeading
		>
			<TemplateGenerator
				key={template.id}
				config={config}
				// 분류는 URL이 아니라 템플릿 자신이 갖는다 — 이 템플릿을 담고 있는 카테고리에서 읽는다.
				categoryTitle={
					navigation.categories.find((category) =>
						category.templates.some((item) => item.slug === templateSlug),
					)?.title ?? null
				}
				template={template}
			/>
		</StudioWorkspacePage>
	)
}
