/** CMS의 평면 순서를 유지하면서 서브섹션을 직전 메인에 연결한다. */
export function groupSections<T extends { id: string; hierarchy: 'main' | 'sub'; title: string }>(
	sections: readonly T[],
) {
	const groups: { section: T; subsections: T[] }[] = []
	const ids = new Set<string>()
	for (const section of sections) {
		if (!section.title.trim() || !section.id.trim() || ids.has(section.id))
			throw new Error('섹션 제목과 고유 ID가 필요합니다.')
		ids.add(section.id)
		if (section.hierarchy === 'main') groups.push({ section, subsections: [] })
		else {
			const parent = groups.at(-1)
			if (!parent) throw new Error('첫 항목은 메인 섹션이어야 합니다.')
			parent.subsections.push(section)
		}
	}
	return groups
}
