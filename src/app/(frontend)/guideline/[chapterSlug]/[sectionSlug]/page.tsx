import { RichText } from '@payloadcms/richtext-lexical/react'
import { notFound } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { GuidelineImage } from '@/features/guideline/components/blocks/children/guideline-image'
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
				<GuidelineSectionHeader
					title={sectionView.title}
					image={sectionView.headerImage}
					description={sectionView.description}
				/>
			</header>
			<GuidelineBlocks blocks={sectionView.blocks} />
			<section className="mb-16">
				{sectionView.pages.map((page) => (
					<GuidelinePage key={page.id} page={page} />
				))}
			</section>
		</article>
	)
}

function GuidelineSectionHeader({
	title,
	image,
	description,
}: {
	title?: string | null
	image?: GetGuidelineSectionOutput['headerImage']
	description?: string | null
}) {
	if (!title) return null
	const hasImage = image && typeof image === 'object'
	return (
		<>
			<div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700">
				<GuidelineImage
					image={image}
					className="absolute inset-0 h-full w-full"
					imgClassName="h-full w-full object-cover"
				/>
				{hasImage && <div className="absolute inset-0 bg-black/25" />}
				<h1 className={`relative text-5xl ${hasImage ? 'text-white' : ''}`}>{title}</h1>
			</div>
			{description && (
				<section className="mt-8 grid gap-4 md:grid-cols-2">
					<p className="leading-7 tracking-normal md:col-start-2">{description}</p>
				</section>
			)}
		</>
	)
}

function GuidelineContentHeader({
	title,
	description,
	order,
}: {
	title: string
	description: React.ReactNode
	order?: number
}) {
	return (
		<section className="grid gap-4 md:grid-cols-2">
			<div className="flex flex-col gap-8 md:col-start-2">
				<hgroup className="flex gap-4 font-semibold">
					{order !== undefined && (
						<p className="text-neutral-400 dark:text-neutral-700">{order}</p>
					)}
					{order === undefined ? (
						<h1 className="text-3xl">{title}</h1>
					) : (
						<h2 className="text-2xl">{title}</h2>
					)}
				</hgroup>
				{description}
			</div>
		</section>
	)
}

function GuidelinePage({ page }: { page: GetGuidelineSectionOutput['pages'][number] }) {
	const order = page.displayOrder + 1

	return (
		<>
			<Separator />
			<article id={page.slug} className="mb-40">
				<GuidelineContentHeader
					title={page.title}
					order={order}
					description={
						page.description && (
							<RichText
								data={page.description}
								className="space-y-0.5 leading-7 tracking-normal"
							/>
						)
					}
				/>
				<GuidelineBlocks blocks={page.blocks} />
			</article>
		</>
	)
}
