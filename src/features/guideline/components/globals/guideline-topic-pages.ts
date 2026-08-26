/**
 * 토픽의 표시용 하위 Page 목록 — 제목이 토픽과 동일한 단일 Page는 접는다(fold).
 * 그런 토픽은 사실상 페이지가 하나이므로 목차/분기를 만들지 않는다.
 */
export function getGuidelineTopicPages<S extends { title: string; pages: { title: string }[] }>(
	topic: S,
): S['pages'] {
	return topic.pages.length === 1 && topic.pages[0]?.title.trim() === topic.title.trim()
		? ([] as S['pages'])
		: topic.pages
}
