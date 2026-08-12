import { ArrowRight } from '@carbon/icons-react'
import { ContentFrame } from '@/components/shared/content-frame'
import { ContentHeading } from '@/components/shared/content-heading'
import { NavigationBlock } from '@/components/shared/navigation/navigation-block'
import { getStudioTemplateCategoryRoute, routes } from '@/lib/routes'

// 렌더링: 정적. Payload 데이터를 읽지 않으므로 낡을 것이 없다.
// 🔴 방식을 선언으로 못박는다 — 선언이 없으면 Next가 추론하고, 그 추론은 프로덕션 빌드에서만
//    드러나 무관한 수정(권한·쿠키 조회 추가) 하나로 조용히 뒤집힌다(docs/05 「렌더링 캐시 무효화」).
export const dynamic = 'force-static'

const navigationTail = <ArrowRight aria-hidden className="ml-auto" size={24} />

export default function StudioPage() {
	return (
		<ContentFrame className="grid gap-16">
			<section>
				<div className="grid grid-cols-1 gap-4">
					<NavigationBlock
						variant="default"
						className="aspect-[2/1]"
						label="New Templates"
						href={routes.studio.template}
						tail={navigationTail}
					/>
				</div>
			</section>
			<section>
				<ContentHeading level={2} title="Images" className="pb-8" />
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<NavigationBlock
						variant="default"
						className="aspect-[2/1]"
						label="Illustrations"
						href={getStudioTemplateCategoryRoute('illustrations')}
						tail={navigationTail}
					/>
					<NavigationBlock
						variant="default"
						className="aspect-[2/1]"
						label="Gradient"
						href={getStudioTemplateCategoryRoute('gradients')}
						tail={navigationTail}
					/>
				</div>
			</section>
			<section>
				<ContentHeading
					level={2}
					title="Templates"
					helpText="Browse reusable assets for brand production."
					className="pb-8"
				/>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3 [&>[data-slot=navigation-block]]:aspect-square">
					<NavigationBlock
						variant="default"
						className="md:col-span-2 md:row-span-2"
						label="Events"
						href={getStudioTemplateCategoryRoute('events')}
						tail={navigationTail}
					/>
					<NavigationBlock
						variant="default"
						label="Stationery"
						href={getStudioTemplateCategoryRoute('stationery')}
						tail={navigationTail}
					/>
					<NavigationBlock
						variant="default"
						label="Stationery"
						href={getStudioTemplateCategoryRoute('stationery')}
						tail={navigationTail}
					/>
					<NavigationBlock
						variant="default"
						label="Stationery"
						href={getStudioTemplateCategoryRoute('stationery')}
						tail={navigationTail}
					/>
					<NavigationBlock
						variant="default"
						label="Stationery"
						href={getStudioTemplateCategoryRoute('stationery')}
						tail={navigationTail}
					/>
				</div>
			</section>
		</ContentFrame>
	)
}
