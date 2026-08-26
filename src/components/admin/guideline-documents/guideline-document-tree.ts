// title은 required지만 초안은 required 검증을 건너뛰므로 비어 있을 수 있다(제목 없이 저장한 새 문서).
export type GuidelineTopicRow = {
	_status?: 'draft' | 'published' | null
	chapter: number | { id: number } | null
	displayOrder: number
	id: number
	title: string | null
}

export type GuidelineChapterGroup = {
	id: number | null
	title: string
	topics: GuidelineTopicRow[]
}

const chapterId = (chapter: GuidelineTopicRow['chapter']) =>
	typeof chapter === 'object' && chapter !== null ? chapter.id : chapter

/**
 * 토픽을 챕터별로 묶는다.
 *
 * 🔴 계층 트리가 아니라 **한 겹 그룹**이다(2026-08-26). 챕터가 별도 컬렉션이 되면서 문서
 *    자기참조가 사라졌다 — 재귀로 그릴 것이 없다.
 * 🔴 챕터가 비어 있는 토픽도 버리지 않는다. `chapter`는 required지만 초안은 그 검증을
 *    건너뛰므로 실제로 생길 수 있고, 목록에서 사라지면 고칠 방법이 없어진다.
 */
export function groupGuidelineTopicsByChapter(
	topics: GuidelineTopicRow[],
	chapters: { id: number; title: string }[],
): GuidelineChapterGroup[] {
	const sorted = [...topics].sort(
		(a, b) =>
			a.displayOrder - b.displayOrder || (a.title ?? '').localeCompare(b.title ?? '', 'ko'),
	)

	const groups: GuidelineChapterGroup[] = chapters.map((chapter) => ({
		id: chapter.id,
		title: chapter.title,
		topics: sorted.filter((topic) => chapterId(topic.chapter) === chapter.id),
	}))

	const orphans = sorted.filter(
		(topic) => !chapters.some((chapter) => chapter.id === chapterId(topic.chapter)),
	)

	return orphans.length > 0
		? [...groups, { id: null, title: '챕터 없음', topics: orphans }]
		: groups
}
