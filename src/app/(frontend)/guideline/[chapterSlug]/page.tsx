import { notFound } from 'next/navigation'
import { GuidelineChapter } from '@/features/guideline/components/pages/guideline-chapter'
import { getGuidelineChapter } from '@/features/guideline/services/get-guideline-chapter.service'

export default async function GuidelineChapterPage({
	params,
}: {
	params: Promise<{ chapterSlug: string }>
}) {
	const { chapterSlug } = await params
	const chapter = await getGuidelineChapter(chapterSlug)

	if (!chapter) {
		notFound()
	}

	return <GuidelineChapter chapter={chapter} chapterSlug={chapterSlug} />
}
