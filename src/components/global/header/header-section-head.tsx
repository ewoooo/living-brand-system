import Image from 'next/image'
import Link from 'next/link'
import { routes } from '@/lib/routes'

export function HeaderHead({ className }: { className?: string }) {
	const LOGO_SIZE = 16

	return (
		<section className={className}>
			<Link
				aria-label="메인으로 이동"
				className="flex size-8 shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-60"
				href={routes.home}
			>
				<Image
					alt=""
					className="size-3.5 brightness-0 dark:invert"
					height={LOGO_SIZE}
					src="/logos/logo.svg"
					width={LOGO_SIZE}
				/>
			</Link>
		</section>
	)
}
