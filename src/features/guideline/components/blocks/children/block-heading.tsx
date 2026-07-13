/** 가이드라인 블록 공통 제목. title이 없으면 렌더하지 않는다. */
export function BlockHeading({ title }: { title?: string | null }) {
	if (!title) return null
	return <h3 className="mb-6 font-semibold text-xl">{title}</h3>
}
