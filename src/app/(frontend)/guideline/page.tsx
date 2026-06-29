import Link from 'next/link'
import { getGuidelineNavigation } from '@/services/get-guideline-navigation.service'

export default async function GuidelineIndexPage() {
	const { title, sections } = await getGuidelineNavigation()

	return (
		<article className="w-full px-8 py-10">
			<header className="mb-8">
				<h1 className="font-semibold text-5xl">{title}</h1>
			</header>
			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{sections.map((section) => (
					<Link
						key={section.id}
						href={section.href}
						className="rounded-md border border-neutral-200 p-5 transition-colors hover:bg-neutral-500/5 dark:border-neutral-800"
					>
						<h2 className="font-medium text-xl">{section.title}</h2>
						{section.description && (
							<p className="mt-3 text-muted-foreground text-sm leading-6">
								{section.description}
							</p>
						)}
					</Link>
				))}
			</section>
		</article>
	)
}
