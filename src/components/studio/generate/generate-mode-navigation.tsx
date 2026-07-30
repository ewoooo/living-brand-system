'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { routes } from '@/lib/routes'

const items = [
	{ href: routes.studio.generate, label: '이미지 생성' },
	{ href: routes.studio.generateGraphic, label: '그래픽 생성' },
] as const

/** Generate 안에서 이미지와 그래픽 제작 화면을 전환하는 로컬 내비게이션. */
export function GenerateModeNavigation() {
	const pathname = usePathname()
	const graphicActive = pathname.startsWith(routes.studio.generateGraphic)

	return (
		<nav aria-label="생성 유형" className="border-b border-border px-4 py-2 md:px-8">
			<ButtonGroup>
				{items.map(({ href, label }) => {
					const active =
						href === routes.studio.generateGraphic ? graphicActive : !graphicActive

					return (
						<Button key={href} asChild variant={active ? 'muted' : 'ghost'}>
							<Link href={href} aria-current={active ? 'page' : undefined}>
								{label}
							</Link>
						</Button>
					)
				})}
			</ButtonGroup>
		</nav>
	)
}
