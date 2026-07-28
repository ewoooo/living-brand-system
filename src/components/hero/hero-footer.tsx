import Image from 'next/image'
import Link from 'next/link'

import { Typography } from '@/components/ui/typography'
import { getGuidelineMetadata } from '@/features/guideline/services/get-guideline-metadata.service'
import { cn } from '@/lib/utils'

const FOOTER_LINK_GROUPS = [
	{
		label: 'Guideline',
		links: [{ href: '/guideline', label: 'Overview' }],
	},
	{
		label: 'Studio',
		links: [
			{ href: '/create', label: 'Templates' },
			{ href: '/generate', label: 'Generate' },
			{ href: '/review', label: 'Review' },
		],
	},
	{
		label: 'System',
		links: [{ href: '/admin', label: 'Admin ↗' }],
	},
] as const

export async function HeroFooter() {
	const { companyName, primaryDarkForegroundHex, primaryForegroundHex } =
		await getGuidelineMetadata()
	const logoClassName = cn(
		'brightness-0',
		primaryForegroundHex !== '#000000' && 'invert',
		primaryDarkForegroundHex === '#FFFFFF' ? 'dark:invert' : 'dark:invert-0',
	)

	return (
		<footer
			data-slot="hero-footer"
			className="relative z-10 overflow-hidden rounded-xl bg-primary text-primary-foreground"
		>
			<div className="grid gap-16 p-8 md:grid-cols-[minmax(0,1fr)_auto] md:p-12">
				<div className="flex flex-col items-start">
					<Image
						alt=""
						aria-hidden="true"
						className={`size-6 ${logoClassName}`}
						height={24}
						src="/logos/logo.svg"
						width={24}
					/>
					<Typography as="p" className="mt-6" size="2xl" weight="semibold">
						Living Brand System
					</Typography>
					<Typography as="p" className="mt-2 max-w-sm" size="sm">
						브랜드 기준을 작업 과정에 연결합니다.
					</Typography>
					<Typography as="p" className="mt-4 opacity-60" size="xs">
						© {new Date().getFullYear()} {companyName}. All rights reserved.
					</Typography>
				</div>

				<nav aria-label="푸터 메뉴" className="grid grid-cols-3 gap-8 md:gap-16">
					{FOOTER_LINK_GROUPS.map((group) => (
						<div key={group.label}>
							<Typography as="p" size="xs" weight="semibold">
								{group.label}
							</Typography>
							<ul className="mt-4 space-y-2">
								{group.links.map((link) => (
									<li key={link.href}>
										<Link
											className="text-sm transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
											href={link.href}
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</nav>
			</div>

			<div
				aria-hidden="true"
				className="flex items-end justify-center gap-[3vw] overflow-hidden px-6 md:px-10"
			>
				<Image
					alt=""
					className={`h-auto w-[18vw] min-w-28 shrink-0 ${logoClassName}`}
					height={715}
					src="/logos/logo.svg"
					width={708}
				/>
				<span className="translate-y-[0.06em] whitespace-nowrap font-body text-9xl leading-[0.68] font-semibold tracking-[-0.08em]">
					LBS
				</span>
			</div>
		</footer>
	)
}
