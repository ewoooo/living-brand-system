import Link from 'next/link'
import { Fragment } from 'react'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import {
	type GetGuidelineNavigationOutput,
	getGuidelineNavigation,
} from '@/features/guideline/services/get-guideline-navigation.service'

export default async function GuidelineIndexPage() {
	const { title, chapters } = await getGuidelineNavigation()

	return (
		<>
			<header className="mb-8">
				<hgroup className="mb-4">
					<p className="pb-1 text-muted-foreground text-xl">시작하기</p>
					<h1 className="font-semibold text-3xl">{title}</h1>
				</hgroup>
				<div className="mb-4 max-w-2xl text-balance text-muted-foreground">
					<p>
						가이드라인은 브랜드 기준을 구축하기 위한 운영 문서입니다. 이를 사용해 브랜드
						원칙을 이해하고, <wbr /> 제작 기준을 계획하고 적용하고, 결과물을 검수하고,
						이미 사용 중인 도구와 함께 일관된 산출물을 만들 수 있습니다.
					</p>
					<p>
						The identity guidelines serve as the definitive source of truth—a rubric by
						which we gauge the success of everything we make (from furniture to campaign
						ads to retail catalogs), everywhere we show up (from brick-and-mortar
						showrooms to digital experiences to exhibition wall copy). Each component of
						the visual language is outlined individually, as well as how the full system
						works together. In the end, guidelines are just that—a guide. Always use
						your best judgment when creating materials and use this as a starting point.
					</p>
				</div>
				<div className="aspect-video rounded-md bg-neutral-500/10" />
			</header>
			<section className="mb-8">
				<hgroup>
					<p>Contents</p>
					<h2 className="pb-4 font-semibold text-xl">여기서 시작하기</h2>
				</hgroup>
				<section>
					<GuidelineListOfContents chapters={chapters} />
				</section>
				<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{chapters.map((chapter) => (
						<Link
							key={chapter.id}
							href={chapter.href}
							className="rounded-md border border-neutral-200 p-4 transition-colors hover:bg-neutral-500/5 dark:border-neutral-800"
						>
							<h3 className="font-semibold text-lg">{chapter.title}</h3>
							{chapter.description && (
								<p className="mt-3 text-muted-foreground text-sm leading-6">
									{chapter.description}
								</p>
							)}
						</Link>
					))}
				</section>
			</section>
		</>
	)
}

type Chapters = GetGuidelineNavigationOutput['chapters']

function GuidelineListOfContents({ chapters }: { chapters: Chapters }) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead scope="col" className="w-24">
						단계
					</TableHead>
					<TableHead scope="col">목차</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{chapters.map((chapter) => (
					<Fragment key={chapter.id}>
						<TableRow className="bg-muted/50">
							<TableCell>장</TableCell>
							<TableCell className="font-semibold">
								<Link href={chapter.href}>{chapter.title}</Link>
							</TableCell>
						</TableRow>

						{chapter.sections.map((section) => (
							<TableRow key={section.id}>
								<TableCell className="text-muted-foreground">섹션</TableCell>
								<TableCell className="pl-6 font-medium">
									<Link href={section.href}>{section.title}</Link>
								</TableCell>
							</TableRow>
						))}
					</Fragment>
				))}
			</TableBody>
		</Table>
	)
}
