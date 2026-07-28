import { PageHeader } from '@/components/global/page-header'
import { SectionLayout } from '@/components/global/section-layout'
import { StudioSideNavigation } from '@/components/global/studio-side-navigation'
import { NavigationBlock } from '@/components/navigation-block'
import { getCreateNavigation } from '@/features/asset-generation/services/get-create-navigation.service'
import { GuidelineContentFrame } from '@/features/guideline/components/guideline-content-frame'

// Studio 사이드바의 발행 템플릿을 요청 시점에 표시한다.
export const dynamic = 'force-dynamic'

export default async function StudioPage() {
	const navigation = await getCreateNavigation()

	return (
		<SectionLayout nav={<StudioSideNavigation navigation={navigation} />}>
			<GuidelineContentFrame className="grid gap-16">
				<section>
					<PageHeader title="Create What You Want" />
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<NavigationBlock
							variant="section"
							className="aspect-[2/1]"
							label="New Templates"
							href="/studio/templates"
						/>
						<NavigationBlock
							variant="section"
							className="aspect-[2/1]"
							label="Quickstart"
							href="/studio/quickstart"
						/>
					</div>
				</section>
				<section>
					<PageHeader title="Images" />
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<NavigationBlock
							variant="section"
							className="aspect-[2/1]"
							label="Illustrations"
							href="/studio/create/illustrations"
						/>
						<NavigationBlock
							variant="section"
							className="aspect-[2/1]"
							label="Gradient"
							href="/studio/create/gradients"
						/>
					</div>
				</section>
				<section>
					<PageHeader title="Assets" />
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<NavigationBlock
							variant="section"
							className="aspect-[2/1]"
							label="Events"
							href="/studio/create/events"
						/>
						<NavigationBlock
							variant="section"
							className="aspect-[2/1]"
							label="Stationery"
							href="/studio/create/stationery"
						/>
					</div>
				</section>
				<section>
					<PageHeader title="Templates" />
					<div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
						<NavigationBlock
							variant="section"
							className="aspect-[2/1]"
							label="Events"
							href="/studio/create/events"
						/>
						<NavigationBlock
							variant="section"
							className="aspect-[2/1] md:aspect-auto"
							label="Stationery"
							href="/studio/create/stationery"
						/>
					</div>
				</section>
			</GuidelineContentFrame>
		</SectionLayout>
	)
}
