import { notFound } from 'next/navigation'
import type { GetGuidelinePageOutput } from '@/services/get-guideline-page.service'
import { getGuidelinePage } from '@/services/get-guideline-page.service'

interface GuidelinePageProps {
	params: Promise<{
		pageId: string
	}>
}

export default async function GuidelinePage({ params }: GuidelinePageProps) {
	const { pageId } = await params
	const pageView: GetGuidelinePageOutput | null = await getGuidelinePage({ pageId })

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
