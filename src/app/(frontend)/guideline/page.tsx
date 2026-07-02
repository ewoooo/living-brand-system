import Link from 'next/link'
import { getGuidelineNavigation } from '@/features/guideline/services/get-guideline-navigation.service'

export default async function GuidelineIndexPage() {
	const { title, sections } = await getGuidelineNavigation()

	return (
		<main className="w-full max-w-[1250px] px-8 py-10">
			<header className="mb-8">
				<hgroup className="mb-4">
					<h2 className="pb-1 text-muted-foreground text-xl">시작하기</h2>
					<h1 className="text-3xl">{title}</h1>
				</hgroup>
				<p className="mb-4 text-muted-foreground">
					가이드라인은 브랜드 기준을 구축하기 위한 운영 문서입니다. 이를 사용해 브랜드
					원칙을 이해하고, <wbr /> 제작 기준을 계획하고 적용하고, 결과물을 검수하고, 이미
					사용 중인 도구와 함께 일관된 산출물을 만들 수 있습니다.
				</p>
				<div className="aspect-video rounded-md bg-neutral-500/10" />
			</header>
			<section className="mb-8">
				<h3 className="pb-4 text-xl">여기서 시작하기</h3>
				<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{sections.map((section) => (
						<Link
							key={section.id}
							href={section.href}
							className="rounded-md border border-neutral-200 p-4 transition-colors hover:bg-neutral-500/5 dark:border-neutral-800"
						>
							<h2 className="text-lg">{section.title}</h2>
							{section.description && (
								<p className="mt-3 text-muted-foreground text-sm leading-6">
									{section.description}
								</p>
							)}
						</Link>
					))}
				</section>
			</section>
		</main>
	)
}
