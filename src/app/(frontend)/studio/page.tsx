import { PageHeader } from '@/components/global/page-header'
import { SectionLayout } from '@/components/global/section-layout'
import { StudioSideNavigation } from '@/components/global/studio-side-navigation'
import { getCreateNavigation } from '@/features/asset-generation/services/get-create-navigation.service'
import { GuidelineContentFrame } from '@/features/guideline/components/guideline-content-frame'

// Studio 사이드바의 발행 템플릿을 요청 시점에 표시한다.
export const dynamic = 'force-dynamic'

export default async function StudioPage() {
	const navigation = await getCreateNavigation()

	return (
		<SectionLayout nav={<StudioSideNavigation navigation={navigation} />}>
			<GuidelineContentFrame>
				<section className="flex flex-col gap-4">
					<PageHeader title="Create What You Want" />
					<div className="grid grid-cols-[2fr_1fr]">
						<article>New Templates</article>
						<article className="aspect-square">Quickstart</article>
					</div>
				</section>
				<section>
					<PageHeader title="Images" />
					<div className="grid grid-cols-3">
						<article>HD Illustration</article>
						<article className="aspect-square">HD Gradient</article>
						<article className="aspect-square">HD Gradient</article>
					</div>
				</section>
				<section className="flex flex-col gap-4">
					<PageHeader title="Assets" />
					<div className="grid grid-cols-[2fr_1fr]">
						<article>New Templates</article>
						<article className="aspect-square">Quickstart</article>
					</div>
				</section>
			</GuidelineContentFrame>
		</SectionLayout>
	)
}
