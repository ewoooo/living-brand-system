/**
 * 섹션의 표시용 하위 Page 목록 — 제목이 섹션과 동일한 단일 Page는 접는다(fold).
 * 그런 섹션은 사실상 페이지가 하나이므로 목차/분기를 만들지 않는다.
 */
export function getGuidelineSectionPages<S extends { title: string; pages: { title: string }[] }>(
	section: S,
): S['pages'] {
	return section.pages.length === 1 && section.pages[0]?.title.trim() === section.title.trim()
		? ([] as S['pages'])
		: section.pages
}
