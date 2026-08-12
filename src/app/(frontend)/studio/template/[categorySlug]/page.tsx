import { ArrowRight } from '@carbon/icons-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ContentFrame } from '@/components/shared/content-frame'
import { Typography } from '@/components/ui/typography'
import { getCreateNavigation } from '@/features/template-customization/services/get-create-navigation.service'

export default async function CreateCategoryPage({
	params,
}: {
	params: Promise<{ categorySlug: string }>
}) {
	const [{ categorySlug }, navigation] = await Promise.all([params, getCreateNavigation()])
	const category = navigation.categories.find((item) => item.slug === categorySlug)

	if (!category) {
		notFound()
	}

	return (
		<ContentFrame className="py-10">
			<article>
				<Typography as="h1" family="title" size="5xl">
					{category.title}
				</Typography>
				{category.templates.length > 0 ? (
					<ul className="mt-8 border-border border-y">
						{category.templates.map((template) => (
							<li
								key={template.id}
								className="border-border border-b last:border-b-0"
							>
								<Link
									href={template.href}
									className="group flex items-center justify-between gap-4 py-5 transition-colors hover:bg-muted"
								>
									<Typography size="xl">{template.name}</Typography>
									<ArrowRight
										aria-hidden
										className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1"
									/>
								</Link>
							</li>
						))}
					</ul>
				) : (
					<Typography className="mt-6" size="sm" tone="muted">
						이 카테고리에 발행된 템플릿이 없습니다.
					</Typography>
				)}
			</article>
		</ContentFrame>
	)
}
