import { RichText } from '@payloadcms/richtext-lexical/react'
import { notFound } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { GuidelineBlocks } from '@/features/guideline/components/blocks/guideline-blocks'
import {
	type GetGuidelineSectionOutput,
	getGuidelineSection,
} from '@/features/guideline/services/get-guideline-section.service'

export default async function GuidelineSectionPage({
	params,
}: {
	params: Promise<{ chapterSlug: string; sectionSlug: string }>
}) {
	const { chapterSlug, sectionSlug } = await params
	const sectionView = await getGuidelineSection(chapterSlug, sectionSlug)

	if (!sectionView) {
		notFound()
	}

	return (
		<article className="grid w-full grid-rows-[auto_1fr]">
			<header className="mb-10">
				<GuidelineSectionHeader title={sectionView.title} />
			</header>
			<section className="mb-16">
				{sectionView.pages.map((page) => (
					<GuidelinePage key={page.id} page={page} />
				))}
			</section>
		</article>
	)
}

function GuidelineSectionHeader({ title }: { title?: string | null }) {
	if (!title) return null
	return (
		<div className="grid aspect-video place-items-center rounded-2xl border border-neutral-200 dark:border-neutral-700">
			<h1 className="text-5xl">{title}</h1>
		</div>
	)
}

function GuidelinePage({ page }: { page: GetGuidelineSectionOutput['pages'][number] }) {
	const order = page.displayOrder + 1

	return (
		<>
			<Separator />
			<article id={page.slug} className="mx-auto mb-40 max-w-[1250px]">
				<section className="grid grid-cols-2 gap-4">
					<div className="col-start-2 flex flex-col gap-8">
						<hgroup className="flex gap-4 font-semibold">
							<p className="text-neutral-400 dark:text-neutral-700">{order}</p>
							<h2>{page.title}</h2>
						</hgroup>
						{page.description && (
							<RichText
								data={page.description}
								className="space-y-0.5 leading-7 tracking-normal"
							/>
						)}
					</div>
				</section>
				<GuidelineBlocks blocks={page.blocks} />
			</article>
		</>
	)
}
