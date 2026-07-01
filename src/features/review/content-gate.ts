import ruleset from '@/features/review/data/essenherb-ruleset.json'

/**
 * 이미지에 어떤 콘텐츠가 포함됐는지 나타내는 플래그. 유저가 업로드 시 선택한다.
 * 확장 열림 — 지금은 photo만 사용하고, 향후 logo/text/illustration을 추가한다.
 */
export interface ImageContentFlags {
	photo: boolean
	// 향후: logo, text, illustration
}

export const DEFAULT_CONTENT_FLAGS: ImageContentFlags = { photo: false }

/**
 * section slug → 그 섹션이 요구하는 콘텐츠 플래그.
 * 매핑에 없는 섹션은 콘텐츠와 무관하게 항상 활성이다.
 * 지금은 photography 섹션이 사진(photo)을 요구하는 것 하나 — 확장 시 한 줄 추가한다.
 */
export const SECTION_CONTENT_REQUIREMENT: Partial<Record<string, keyof ImageContentFlags>> = {
	photography: 'photo',
}

/** 이 콘텐츠 플래그 상태에서 해당 섹션이 검수 대상인지. */
export function isSectionActive(slug: string, flags: ImageContentFlags): boolean {
	const required = SECTION_CONTENT_REQUIREMENT[slug]
	return required ? flags[required] : true
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
