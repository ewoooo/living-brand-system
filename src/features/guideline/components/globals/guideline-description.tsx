import { RichText } from '@payloadcms/richtext-lexical/react'
import type { LayoutBlock } from '@/payload-types'
import type { GuidelineVariant } from './guideline-variant'

// 설명은 블록·섹션가 갖는다 — 토픽 문서의 설명은 2026-08-26에 제거했다(Figma의 Section Heading도
// 제목뿐이고, 14개 토픽 전수 조사에서 값이 하나도 없었다).
type DescriptionVariant = Extract<GuidelineVariant, 'section' | 'block'>

const STYLE: Record<DescriptionVariant, string> = {
	section: 'font-body font-normal text-sm space-y-2 pr-8',
	// whitespace-pre-line: 본문 text 노드에 들어있는 개행(\n)을 줄바꿈으로 렌더한다.
	block: 'font-body font-normal text-sm space-y-2 whitespace-pre-line pr-8',
}

export function GuidelineDescription({
	variant,
	description,
}: {
	variant: DescriptionVariant
	description: LayoutBlock['description']
}) {
	// 비어 있으면 아무것도 렌더하지 않는다 — 설명은 optional이라 경고 표시도 하지 않는다.
	if (!description) return null

	return (
		<div className="text-balance">
			<RichText className={STYLE[variant]} data={description} />
		</div>
	)
}
