import ruleset from '@/features/review/data/essenherb-ruleset.json'

/**
 * 이미지에 어떤 디자인 요소가 포함됐는지 나타내는 플래그. 유저가 업로드 후 체크로 선택한다.
 * 체크된 요소의 섹션만 검수 대상이 된다 (color-system 등 매핑 밖 섹션은 항상 활성).
 */
export interface ImageContentFlags {
	logo: boolean
	typography: boolean
	illustration: boolean
	photography: boolean
}

export const DEFAULT_CONTENT_FLAGS: ImageContentFlags = {
	logo: false,
	typography: false,
	illustration: false,
	photography: false,
}

/** 체크박스 UI 라벨 (안내 문구에도 재사용). 표시 순서도 이 순서를 따른다. */
export const CONTENT_FLAG_LABELS: Record<keyof ImageContentFlags, string> = {
	logo: 'Logo',
	typography: 'Typography',
	illustration: 'Illustration',
	photography: 'Photography',
}

/**
 * section slug → 그 섹션이 요구하는 콘텐츠 플래그.
 * 매핑에 없는 섹션(color-system, visual-system, 챕터 A·C 전체)은 콘텐츠와 무관하게 항상 활성.
 * 즉 Color는 기본 검수, 나머지 챕터 B 섹션은 해당 요소를 체크했을 때만 검수한다.
 */
export const SECTION_CONTENT_REQUIREMENT: Partial<Record<string, keyof ImageContentFlags>> = {
	'brand-logo': 'logo',
	typography: 'typography',
	illustration: 'illustration',
	photography: 'photography',
}

/** 이 콘텐츠 플래그 상태에서 해당 섹션이 검수 대상인지. */
export function isSectionActive(slug: string, flags: ImageContentFlags): boolean {
	const required = SECTION_CONTENT_REQUIREMENT[slug]
	return required ? flags[required] : true
}

/** 섹션이 요구하는 요소의 라벨 (없으면 null — 항상 활성 섹션). 안내 문구용. */
export function sectionRequiredLabel(slug: string): string | null {
	const required = SECTION_CONTENT_REQUIREMENT[slug]
	return required ? CONTENT_FLAG_LABELS[required] : null
}

/** 활성 섹션에 속한 rule key 목록 (현재 콘텐츠 플래그 기준 검수 대상). */
export function activeRuleKeys(flags: ImageContentFlags): string[] {
	const keys = new Set<string>()
	for (const chapter of ruleset.chapters) {
		for (const section of chapter.sections) {
			if (!isSectionActive(section.slug, flags)) continue
			for (const page of section.pages) {
				for (const rule of page.rules) keys.add(rule.key)
			}
		}
	}
	return [...keys]
}
