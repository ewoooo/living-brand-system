/**
 * 토픽의 표시용 꼭지 목록 — 제목이 토픽과 동일한 단일 꼭지는 접는다(fold).
 * 그런 토픽은 사실상 꼭지가 하나이므로 목차/분기를 만들지 않는다.
 */
export function getGuidelineTopicSections<
	S extends { title: string; sections: { title: string }[] },
>(topic: S): S['sections'] {
	return topic.sections.length === 1 && topic.sections[0]?.title.trim() === topic.title.trim()
		? ([] as S['sections'])
		: topic.sections
}
