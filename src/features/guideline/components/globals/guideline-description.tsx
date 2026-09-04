import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SectionBlock } from '@/payload-types'

// 설명은 섹션이 갖는다 — 토픽 문서의 설명은 2026-08-26에, 블록 층은 2026-09-04에 제거했다.
export function GuidelineDescription({
	description,
}: {
	description: SectionBlock['description']
}) {
	// 비어 있으면 아무것도 렌더하지 않는다 — 설명은 optional이라 경고 표시도 하지 않는다.
	if (!description) return null

	return (
		<div className="text-balance">
			<RichText className="font-body font-normal text-sm space-y-2 pr-8" data={description} />
		</div>
	)
}
