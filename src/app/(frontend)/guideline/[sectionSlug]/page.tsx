import { RichText } from '@payloadcms/richtext-lexical/react'
import { notFound } from 'next/navigation'
import { getGuidelineSection } from '@/services/get-guideline-section.service'

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
			<section className="flex max-w-prose flex-col gap-5">
				{sectionView.pages.map((page) => (
					<article key={page.id} id={page.slug} className="scroll-mt-6">
						{/*<p>{page.displayOrder}</p>*/}
						<h2 className="font-semibold">{page.title}</h2>
						{page.policyBody && (
							<RichText
								data={page.policyBody}
								className="space-y-4 leading-7 tracking-normal"
							/>
						)}
					</article>
				))}
			</section>
		</article>
	)
}
