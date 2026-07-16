import { SideNav, SideNavGroup, SideNavItem } from '@/components/global/side-nav/side-nav'
import type { CheckScenario } from '@/features/asset-check/scenarios'

/**
 * check 영역 사이드 내비 — 발행 CheckScenario를 조회 순서대로 노출한다.
 * in : scenarios: CheckScenario[] { key, title, checkKeys[] }
 * 링크: '/review'(검수하기), `/review/rules#${scenario.key}`(시나리오별 카탈로그 앵커)
 */
export function CheckSideNavigation({ scenarios }: { scenarios: CheckScenario[] }) {
	return (
		<SideNav>
			<SideNavGroup>
				<SideNavItem label="검수하기" href="/review" />
			</SideNavGroup>
			<SideNavGroup title="검수 시나리오">
				{scenarios.map((scenario) => (
					<SideNavItem
						key={scenario.key}
						label={scenario.title}
						href={`/review/rules#${scenario.key}`}
					/>
				))}
			</SideNavGroup>
		</SideNav>
	)
}
