import { notFound } from 'next/navigation'
import { Typography } from '@/components/ui/typography'
import { TemplateCreator } from '@/features/template-create/components/template-creator'
import { getPublishedTemplate } from '@/features/template-create/services/get-published-template.service'

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
		<article>
			<Typography as="h1" className="mb-6" family="title" size="5xl">
				{template.name}
			</Typography>
			<TemplateCreator key={template.id} template={template} />
		</article>
	)
}
