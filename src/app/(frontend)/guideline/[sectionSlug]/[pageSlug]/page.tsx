import { notFound } from 'next/navigation'
import { getGuidelinePage } from '@/services/get-guideline-page.service'

export default async function GuidelinePage({
	params,
}: {
	params: Promise<{ sectionSlug: string; pageSlug: string }>
}) {
	const { sectionSlug, pageSlug } = await params
	const pageView = await getGuidelinePage({
		sectionSlug,
		pageSlug,
	})

	if (!pageView) {
		notFound()
	}

	return (
		<article>
			<p>{pageView.sectionTitle}</p>
			<h1>{pageView.title}</h1>
			{pageView.policyTitle && <h2>{pageView.policyTitle}</h2>}
		</article>
	)
}
