import ruleset from '@/features/review/data/essenherb-ruleset.json'

export interface ReviewNavSection {
	code: string
	name: string
	slug: string
	href: string
	startPage: number
	endPage: number
	ruleCount: number
}

export interface ReviewNavChapter {
	code: string
	name: string
	sections: ReviewNavSection[]
}

/**
 * 사이드바 목차(챕터›section)와 단일 section 조회를 만든다.
 * 외부 I/O 없음 — 빌드에 포함된 전처리 산출물(essenherb-ruleset.json)만 읽는다.
 * 검수 실행/판정은 별도 레이어가 담당하고, 여기선 룰셋 탐색만 책임진다.
 */
export function getReviewNavigation(): { title: string; chapters: ReviewNavChapter[] } {
	return {
		title: '검수 룰셋',
		chapters: ruleset.chapters.map((chapter) => ({
			code: chapter.code,
			name: chapter.name,
			sections: chapter.sections.map((section) => ({
				code: section.code,
				name: section.name,
				slug: section.slug,
				href: `/review/${section.slug}`,
				startPage: section.startPage,
				endPage: section.endPage,
				ruleCount: section.pages.reduce((sum, page) => sum + page.rules.length, 0),
			})),
		})),
	}
}

export function getReviewSection(slug: string) {
	for (const chapter of ruleset.chapters) {
		const section = chapter.sections.find((item) => item.slug === slug)
		if (section) return section
	}
	return null
}
