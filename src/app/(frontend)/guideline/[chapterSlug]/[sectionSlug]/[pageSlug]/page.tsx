import { redirect } from 'next/navigation'

export default async function GuidelinePage({
	params,
}: {
	params: Promise<{ chapterSlug: string; sectionSlug: string; pageSlug: string }>
}) {
	const { chapterSlug, sectionSlug, pageSlug } = await params

	redirect(`/guideline/${chapterSlug}/${sectionSlug}#${pageSlug}`)
}
