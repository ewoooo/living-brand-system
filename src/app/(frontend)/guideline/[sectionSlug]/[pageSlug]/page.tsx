import { notFound, redirect } from 'next/navigation'
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

	redirect(`/guideline/${sectionSlug}#${pageSlug}`)
}
