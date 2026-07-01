import { redirect } from 'next/navigation'

export default async function GuidelinePage({
	params,
}: {
	params: Promise<{ sectionSlug: string; pageSlug: string }>
}) {
	const { sectionSlug, pageSlug } = await params

	redirect(`/guideline/${sectionSlug}#${pageSlug}`)
}
