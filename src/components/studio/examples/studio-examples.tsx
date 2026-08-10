'use client'

import { Catalog, DocumentAdd, Idea, Image, Rule, Task, TextFont } from '@carbon/icons-react'
import { useState } from 'react'
import { ContentHeading } from '@/components/shared/content-heading'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

const exampleIcons = {
	brand: Catalog,
	content: TextFont,
	image: Image,
	idea: Idea,
	review: Task,
	rule: Rule,
	template: DocumentAdd,
} as const

const exampleCategories = ['전체', '브랜드 기준', '콘텐츠', '이미지', '템플릿', '검수'] as const

type ExampleCategory = (typeof exampleCategories)[number]

type StudioExample = {
	category: Exclude<ExampleCategory, '전체'>
	description: string
	icon: keyof typeof exampleIcons
	tags: string[]
	title: string
}

const studioExamples: StudioExample[] = [
	{
		category: '브랜드 기준',
		description: '핵심 메시지와 톤을 한 장의 제작 기준으로 정리합니다.',
		icon: 'brand',
		tags: ['BRAND', 'MESSAGE'],
		title: '캠페인 핵심 메시지 정리',
	},
	{
		category: '콘텐츠',
		description: '브랜드의 어조를 반영한 소셜 콘텐츠 초안을 만듭니다.',
		icon: 'content',
		tags: ['COPY', 'SOCIAL'],
		title: '소셜 콘텐츠 카피 작성',
	},
	{
		category: '이미지',
		description: '이미지 생성에 필요한 장면과 시각 언어를 정의합니다.',
		icon: 'image',
		tags: ['IMAGE', 'PROMPT'],
		title: '브랜드 이미지 프롬프트',
	},
	{
		category: '템플릿',
		description: '반복되는 발표 자료의 기본 구조를 빠르게 시작합니다.',
		icon: 'template',
		tags: ['PRESENTATION', 'LAYOUT'],
		title: '발표 자료 구성안',
	},
	{
		category: '검수',
		description: '결과물에서 확인할 브랜드 규칙을 순서대로 점검합니다.',
		icon: 'review',
		tags: ['CHECK', 'QUALITY'],
		title: '제작물 브랜드 검수',
	},
	{
		category: '브랜드 기준',
		description: '제품과 서비스가 지켜야 할 표현 원칙을 설정합니다.',
		icon: 'rule',
		tags: ['VOICE', 'GUIDELINE'],
		title: '브랜드 보이스 원칙',
	},
	{
		category: '콘텐츠',
		description: '아이디어를 캠페인 콘셉트와 실행 항목으로 구체화합니다.',
		icon: 'idea',
		tags: ['CAMPAIGN', 'IDEA'],
		title: '캠페인 콘셉트 확장',
	},
	{
		category: '템플릿',
		description: '배너·포스터에 공통으로 적용할 정보 위계를 구성합니다.',
		icon: 'template',
		tags: ['POSTER', 'HIERARCHY'],
		title: '프로모션 키비주얼 구성',
	},
	{
		category: '이미지',
		description: '사진 선택 기준을 통해 일관된 이미지 인상을 만듭니다.',
		icon: 'image',
		tags: ['PHOTO', 'DIRECTION'],
		title: '사진 아트디렉션 가이드',
	},
]

export function filterStudioExamples(category: ExampleCategory) {
	return category === '전체'
		? studioExamples
		: studioExamples.filter((example) => example.category === category)
}

export function StudioExamples() {
	const [category, setCategory] = useState<ExampleCategory>('전체')
	const examples = filterStudioExamples(category)

	return (
		<section data-slot="studio-examples" aria-label="Studio 예제" className="mx-auto max-w-232">
			<ContentHeading
				title="Examples"
				description="브랜드 제작 흐름을 빠르게 시작할 수 있는 예제를 모았습니다."
			/>
			<Field className="mt-8 w-52">
				<FieldLabel className="text-xs" htmlFor="studio-example-filter">
					예제 필터
				</FieldLabel>
				<Select
					value={category}
					onValueChange={(value) => setCategory(value as ExampleCategory)}
				>
					<SelectTrigger id="studio-example-filter" className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{exampleCategories.map((item) => (
								<SelectItem key={item} value={item}>
									{item}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</Field>
			<div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{examples.map((example) => {
					const Icon = exampleIcons[example.icon]

					return (
						<Card
							key={example.title}
							className="min-h-64 rounded-3xl bg-muted/35 py-0 shadow-none transition-colors hover:bg-muted/60"
						>
							<CardContent className="flex h-full min-h-64 flex-col p-6">
								<div
									className={cn(
										'flex size-9 items-center justify-center rounded-lg border',
										example.category === '이미지'
											? 'border-primary/30 bg-primary/10 text-primary'
											: 'border-highlight/40 bg-highlight/30 text-foreground',
									)}
								>
									<Icon aria-hidden className="size-5" />
								</div>
								<Typography
									as="h2"
									size="xl"
									weight="medium"
									className="mt-5 leading-tight tracking-[-0.02em]"
								>
									{example.title}
								</Typography>
								<Typography size="xs" tone="muted" className="mt-2 leading-relaxed">
									{example.description}
								</Typography>
								<div className="mt-auto flex flex-wrap gap-1 pt-5">
									<Badge shape="sharp" variant="highlight">
										{example.category}
									</Badge>
									{example.tags.map((tag) => (
										<Badge key={tag} shape="sharp" variant="outline">
											{tag}
										</Badge>
									))}
								</div>
							</CardContent>
						</Card>
					)
				})}
			</div>
		</section>
	)
}
