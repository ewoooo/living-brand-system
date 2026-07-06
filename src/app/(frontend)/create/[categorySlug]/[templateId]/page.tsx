import { notFound } from 'next/navigation'
import { GridComposer } from '@/features/asset-generation/components/grid-composer'
import { getPublishedTemplate } from '@/features/asset-generation/services/get-published-template.service'

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

	const template = await getPublishedTemplate(parsedId)

	if (!template) {
		notFound()
	}

	return (
		<article className="w-full max-w-5xl py-12">
			<h1 className="mb-6">{template.name}</h1>
			{/* key로 템플릿마다 강제 리마운트 → 그리드·요소가 해당 템플릿 기준으로 재초기화 */}
			<GridComposer key={template.id} source={template.jsonTemplate} />
		</article>
	)
}
