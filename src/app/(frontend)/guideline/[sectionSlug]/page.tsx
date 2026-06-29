import { notFound } from 'next/navigation'
import { GuidelineBlocks } from '@/features/guideline/components/guideline-blocks'
import { getGuidelineSection } from '@/features/guideline/services/get-guideline-section.service'

export default async function GuidelineSectionPage({
	params,
}: {
	params: Promise<{ sectionSlug: string }>
}) {
	const { sectionSlug } = await params
	const sectionView = await getGuidelineSection({
		sectionSlug,
	})

	if (!sectionView) {
		notFound()
	}

	return (
		<article className="grid w-full grid-rows-[auto_1fr]">
			<header className="mb-10">
				<h1 className="text-5xl">{sectionView.title}</h1>
				{sectionView.description && <p>{sectionView.description}</p>}
			</header>
			<section className="flex flex-col gap-16">
				{sectionView.pages.map((page) => (
					<article key={page.id} id={page.slug} className="scroll-mt-6">
						{/*<p>{page.displayOrder}</p>*/}
						<h2 className="font-semibold">{page.title}</h2>
						<GuidelineBlocks blocks={page.blocks} />
					</article>
				))}
			</section>
		</article>
	)
}
