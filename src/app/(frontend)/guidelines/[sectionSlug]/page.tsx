import { notFound } from 'next/navigation'
import type { GetGuidelineSectionOutput } from '@/services/get-guideline-section.service'
import { getGuidelineSection } from '@/services/get-guideline-section.service'

interface GuidelineSectionPageProps {
	params: Promise<{
		sectionSlug: string
	}>
}

export default async function GuidelineSectionPage({ params }: GuidelineSectionPageProps) {
	const { sectionSlug } = await params
	const sectionView: GetGuidelineSectionOutput | null = await getGuidelineSection({
		sectionSlug,
	})

	if (!sectionView) {
		notFound()
	}

	return (
		<article>
			<header>
				<h1>{sectionView.title}</h1>
				{sectionView.description && <p>{sectionView.description}</p>}
			</header>
			{sectionView.pages.map((page) => (
				<section key={page.id}>
					<p>{page.displayOrder}</p>
					<h2>{page.title}</h2>
					{page.policyTitle && <h3>{page.policyTitle}</h3>}
				</section>
			))}
		</article>
	)
}
