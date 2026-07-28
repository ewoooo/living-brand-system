import { ArrowRight } from '@carbon/icons-react'
import { PageHeader } from '@/components/global/page-header'
import { SectionLayout } from '@/components/global/section-layout'
import { StudioSideNavigation } from '@/components/global/studio-side-navigation'
import { NavigationBlock } from '@/components/navigation-block'
import { getCreateNavigation } from '@/features/asset-generation/services/get-create-navigation.service'
import { GuidelineContentFrame } from '@/features/guideline/components/guideline-content-frame'
import { getImageProfileNavigation } from '@/features/image-generation/services/list-image-profiles.service'
import { authenticateRequest } from '@/lib/request-auth'

// Studio 사이드바의 발행 템플릿을 요청 시점에 표시한다.
export const dynamic = 'force-dynamic'

const navigationTail = <ArrowRight aria-hidden className="ml-auto" size={24} />

export default async function StudioPage() {
	const { user } = await authenticateRequest()
	const [navigation, imageProfiles] = await Promise.all([
		getCreateNavigation(),
		getImageProfileNavigation(user),
	])

	return (
		<SectionLayout
			nav={<StudioSideNavigation navigation={navigation} imageProfiles={imageProfiles} />}
		>
			<GuidelineContentFrame className="grid gap-16">
				<section>
					<div className="grid grid-cols-1 gap-4">
						<NavigationBlock
							variant="md"
							className="aspect-[2/1]"
							label="New Templates"
							href="/studio/templates"
							tail={navigationTail}
						/>
					</div>
				</section>
				<section>
					<PageHeader title="Images" className="pb-8" />
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<NavigationBlock
							variant="md"
							className="aspect-[2/1]"
							label="Illustrations"
							href="/studio/create/illustrations"
							tail={navigationTail}
						/>
						<NavigationBlock
							variant="md"
							className="aspect-[2/1]"
							label="Gradient"
							href="/studio/create/gradients"
							tail={navigationTail}
						/>
					</div>
				</section>
				<section>
					<PageHeader
						title="Templates"
						tip="Browse reusable assets for brand production."
						className="pb-8"
					/>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3 [&>[data-slot=navigation-block]]:aspect-square">
						<NavigationBlock
							variant="md"
							className="md:col-span-2 md:row-span-2"
							label="Events"
							href="/studio/create/events"
							tail={navigationTail}
						/>
						<NavigationBlock
							variant="md"
							label="Stationery"
							href="/studio/create/stationery"
							tail={navigationTail}
						/>
						<NavigationBlock
							variant="md"
							label="Stationery"
							href="/studio/create/stationery"
							tail={navigationTail}
						/>
						<NavigationBlock
							variant="md"
							label="Stationery"
							href="/studio/create/stationery"
							tail={navigationTail}
						/>
						<NavigationBlock
							variant="md"
							label="Stationery"
							href="/studio/create/stationery"
							tail={navigationTail}
						/>
					</div>
				</section>
			</GuidelineContentFrame>
		</SectionLayout>
	)
}
