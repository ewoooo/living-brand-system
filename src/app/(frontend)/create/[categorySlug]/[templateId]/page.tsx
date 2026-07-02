import { notFound } from 'next/navigation'
import { AssetGenerator } from '@/features/asset-generation/components/asset-generator'
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
			<AssetGenerator template={template} />
		</article>
	)
}
