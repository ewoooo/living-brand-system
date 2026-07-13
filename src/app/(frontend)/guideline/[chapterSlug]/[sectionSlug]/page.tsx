import { RichText } from '@payloadcms/richtext-lexical/react'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { GuidelineBlocks } from '@/features/guideline/components/blocks/guideline-blocks'
import { GuidelineHeader } from '@/features/guideline/components/guideline-header'
import { RefreshRouteOnSave } from '@/features/guideline/components/refresh-route-on-save'
import { getGuidelinePagePreview } from '@/features/guideline/services/get-guideline-page-preview.service'
import {
	type GetGuidelineSectionOutput,
	getGuidelineSection,
} from '@/features/guideline/services/get-guideline-section.service'
import { isManager, isPayloadUser } from '@/lib/auth'
import { authenticateRequest } from '@/lib/request-auth'

export default async function GuidelineSectionPage({
	params,
	searchParams,
}: {
	params: Promise<{ chapterSlug: string; sectionSlug: string }>
	searchParams: Promise<{ previewPage?: string }>
}) {
	const { chapterSlug, sectionSlug } = await params
	const previewPage = Number((await searchParams).previewPage)
	const { isEnabled: isDraftMode } = await draftMode()
	let sectionView: GetGuidelineSectionOutput | null = null
	let isPreview = false

	if (isDraftMode && Number.isSafeInteger(previewPage) && previewPage > 0) {
		const { user } = await authenticateRequest()

		if (isPayloadUser(user) && isManager(user)) {
			sectionView = await getGuidelinePagePreview(previewPage, user)
			isPreview = Boolean(sectionView)
		}
	}

	sectionView ??= await getGuidelineSection(chapterSlug, sectionSlug)

	if (!sectionView) {
		notFound()
	}

	return (
		<article className="grid w-full grid-rows-[auto_1fr]">
			{isPreview && <RefreshRouteOnSave />}
			<div className="mb-10">
				<GuidelineHeader title={sectionView.title} image={sectionView.headerImage} />
				{sectionView.description && (
					<section className="mt-8 grid gap-4 md:grid-cols-2">
						<p className="leading-7 tracking-normal md:col-start-2">
							{sectionView.description}
						</p>
					</section>
				)}
			</div>
			<GuidelineBlocks blocks={sectionView.blocks} />
			<section className="mb-16">
				{sectionView.pages.map((page) => (
					<GuidelinePage key={page.id} page={page} />
				))}
			</section>
		</article>
	)
}

function GuidelinePage({ page }: { page: GetGuidelineSectionOutput['pages'][number] }) {
	const order = page.displayOrder + 1

	return (
		<>
			<Separator />
			<article id={page.slug} className="mb-40">
				<GuidelineHeader as="h2" title={page.title} label={order} />
				{page.description && (
					<section className="mt-8 grid gap-4 md:grid-cols-2">
						<RichText
							data={page.description}
							className="space-y-0.5 leading-7 tracking-normal md:col-start-2"
						/>
					</section>
				)}
				<GuidelineBlocks blocks={page.blocks} />
			</article>
		</>
	)
}
