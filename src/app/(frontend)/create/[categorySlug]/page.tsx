import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Typography } from '@/components/ui/typography'
import { getCreateNavigation } from '@/features/asset-generation/services/get-create-navigation.service'

export default async function CreateCategoryPage({
	params,
}: {
	params: Promise<{ categorySlug: string }>
}) {
	const { categorySlug } = await params
	const navigation = await getCreateNavigation()
	const category = navigation.categories.find((item) => item.slug === categorySlug)

	if (!category) {
		notFound()
	}

	return (
		<article>
			<Typography as="h1" family="title" size="3xl">
				{category.title}
			</Typography>
			{category.templates.length > 0 ? (
				<ul className="mt-6 flex flex-col gap-2">
					{category.templates.map((template) => (
						<li key={template.id}>
							<Link
								href={template.href}
								className="font-body text-sm font-normal underline-offset-4 hover:underline"
							>
								{template.name}
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
	)
}
