import Link from 'next/link'
import { notFound } from 'next/navigation'
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
		<article className="w-full max-w-[1250px] px-8 py-10">
			<h1>{category.title}</h1>
			{category.templates.length > 0 ? (
				<ul className="mt-6 flex flex-col gap-2">
					{category.templates.map((template) => (
						<li key={template.id}>
							<Link
								href={template.href}
								className="type-callout underline-offset-4 hover:underline"
							>
								{template.name}
							</Link>
						</li>
					))}
				</ul>
			) : (
				<p className="type-callout mt-6 text-muted-foreground">
					이 카테고리에 발행된 템플릿이 없습니다.
				</p>
			)}
		</article>
	)
}
