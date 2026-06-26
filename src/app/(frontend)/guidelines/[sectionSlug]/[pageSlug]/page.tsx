import { notFound } from 'next/navigation'
import type { GetGuidelinePageOutput } from '@/services/get-guideline-page.service'
import { getGuidelinePage } from '@/services/get-guideline-page.service'

interface GuidelinePageProps {
	params: Promise<{
		sectionSlug: string
		pageSlug: string
	}>
}

export default async function GuidelinePage({ params }: GuidelinePageProps) {
	const { sectionSlug, pageSlug } = await params
	const pageView: GetGuidelinePageOutput | null = await getGuidelinePage({
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
