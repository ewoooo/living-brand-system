import { ImageGroup } from '../kit/image-group'

// SNS Contents 페이지 완성도 컴포지션(데모). 데이터 기반: 섹션 → 인트로 → subtopic ImageGroup 반복.
// ponytail: 페이지 특정 하드코딩(의도적 데모 부채). 이미지는 placeholder — 실이미지/텍스트는 나중에 교체.
// CMS 블록(imageGroup)으로 정식화하기 전까지 임시. GuidelinePage에서 slug='sns-contents'일 때만 렌더.

const shot = (label: string) =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="#3f3f3f"/><text x="200" y="260" font-family="sans-serif" font-size="24" fill="#d4d4d4" text-anchor="middle">${label}</text></svg>`,
	)}`

const images = (prefix: string, n: number) =>
	Array.from({ length: n }, (_, i) => ({
		src: shot(`${prefix} ${String(i + 1).padStart(2, '0')}`),
	}))

type Group = { header: string; body?: string; count: number }
type Section = { title: string; intro?: string; groups: Group[] }

const SECTIONS: Section[] = [
	{
		title: 'Overview',
		intro: 'Essenherb의 SNS Contents는 브랜드가 지향하는 이미지를 표현하는 Brand Contents, 제품을 노출하는 Product Contents, 고객과의 소통을 중심으로 하는 Communication Contents로 구분되어 운영됩니다.',
		groups: [
			{
				header: 'Brand Contents',
				body: '브랜드가 지향하는 이미지를 표현하고 브랜드 메시지를 고객에게 전달하는 콘텐츠.',
				count: 4,
			},
			{
				header: 'Product Contents',
				body: '제품을 노출하고 그와 관련된 정보를 전달하는 콘텐츠.',
				count: 4,
			},
			{
				header: 'Communication Contents',
				body: '고객과의 소통을 중심으로 전개하는 콘텐츠.',
				count: 4,
			},
		],
	},
	{
		title: 'Layout System (Feed)',
		intro: '피드 콘텐츠는 규정된 레이아웃을 적용하여 일관된 룩앤필과 브랜드 통일감을 유지합니다. Format 1080 × 1440 px.',
		groups: [
			{ header: 'Brand Contents', body: '피드용 브랜드 콘텐츠 레이아웃 예시.', count: 4 },
			{ header: 'Product Contents', body: '피드용 제품 콘텐츠 레이아웃 예시.', count: 4 },
			{
				header: 'Communication Contents',
				body: '피드용 커뮤니케이션 콘텐츠 레이아웃 예시.',
				count: 4,
			},
		],
	},
	{
		title: 'Layout System (Reels)',
		intro: '릴스 콘텐츠는 세로형 포맷에 맞춰 규정된 레이아웃을 적용합니다. Format 1080 × 1920 px.',
		groups: [
			{ header: 'Brand Contents', body: '릴스용 브랜드 콘텐츠 레이아웃 예시.', count: 4 },
			{ header: 'Product Contents', body: '릴스용 제품 콘텐츠 레이아웃 예시.', count: 4 },
			{
				header: 'Communication Contents',
				body: '릴스용 커뮤니케이션 콘텐츠 레이아웃 예시.',
				count: 4,
			},
		],
	},
]

export function SnsContentsShowcase() {
	return (
		<div className="mt-8 flex flex-col gap-20">
			{SECTIONS.map((section) => (
				<section key={section.title} className="flex flex-col gap-8">
					{/* sticky는 section을 containing block으로 삼아야 섹션 내내 고정됨(짧은 div로 감싸면 바로 풀림). */}
					<h3 className="sticky top-[163px] z-10 bg-background py-2 font-bold text-2xl text-foreground">
						{section.title}
					</h3>
					{section.intro && (
						<p className="type-body -mt-4 max-w-2xl text-foreground-muted">
							{section.intro}
						</p>
					)}
					{section.groups.map((group) => (
						<ImageGroup
							key={group.header}
							header={group.header}
							body={group.body}
							images={images(group.header.split(' ')[0], group.count)}
						/>
					))}
				</section>
			))}
		</div>
	)
}
