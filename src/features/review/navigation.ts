import ruleset from '@/features/review/data/essenherb-ruleset.json'

export interface ReviewNavSection {
	code: string
	name: string
	slug: string
	/** 단일 페이지 내 앵커 (#slug) */
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
 * 사이드바 목차(챕터›section)를 만든다. 단일 review 페이지의 앵커 목록으로 쓴다.
 * 외부 I/O 없음 — 빌드에 포함된 전처리 산출물(essenherb-ruleset.json)만 읽는다.
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
				href: `#${section.slug}`,
				startPage: section.startPage,
				endPage: section.endPage,
				ruleCount: section.pages.reduce((sum, page) => sum + page.rules.length, 0),
			})),
		})),
	}
}

/**
 * 단일 review 페이지 렌더용 전체 콘텐츠 (챕터›섹션›페이지›룰).
 * 반환 타입은 ruleset JSON에서 추론한다 (ReviewSections가 ReturnType으로 받는다).
 */
export function getReviewContent() {
	return ruleset.chapters.map((chapter) => ({
		code: chapter.code,
		name: chapter.name,
		sections: chapter.sections.map((section) => ({
			code: section.code,
			name: section.name,
			slug: section.slug,
			pages: section.pages,
		})),
	}))
}

/** slug로 단일 섹션(페이지·룰 포함) 조회. 서버 검수 API(/api/review/check)가 쓴다. */
export function getReviewSection(slug: string) {
	for (const chapter of ruleset.chapters) {
		const section = chapter.sections.find((item) => item.slug === slug)
		if (section) return section
	}
	return null
}

/** 전체 rule key (섹션 게이팅 없이 모든 룰을 검수 대상으로 삼는다). */
export function getAllRuleKeys(): string[] {
	return ruleset.chapters.flatMap((chapter) =>
		chapter.sections.flatMap((section) =>
			section.pages.flatMap((page) => page.rules.map((rule) => rule.key)),
		),
	)
}
