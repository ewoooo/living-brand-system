import { GuidelineDescription } from '@/features/guideline/components/globals/guideline-description'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'
import { LogoViewer, type LogoViewerTopic } from './view'

// 로고 뷰어 블록 — 이미지 URL 해석 + topic 설명(richText)을 서버에서 렌더해 클라이언트 뷰어에 넘긴다.
type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type LogoViewerType = Extract<GuidelineBlock, { blockType: 'logoViewer' }>

const DEFAULT_LABEL: Record<string, string> = {
	minSize: 'Minimum Size',
	clearSpace: 'Clear Space',
	registeredMark: 'Registered Trademark',
}

function imageUrl(value: unknown): string | null {
	if (value && typeof value === 'object') {
		const doc = value as { url?: string; filename?: string }
		return doc.url ?? (doc.filename ? `/api/application-images/file/${doc.filename}` : null)
	}
	return null
}

export function LogoViewerBlock({ block }: { block: LogoViewerType }) {
	const logo = imageUrl(block.logo)
	if (!logo) return null

	const topics: LogoViewerTopic[] = (block.topics ?? []).map((topic, index) => ({
		id: topic.id ?? `topic-${index}`,
		kind: topic.kind,
		label: topic.label?.trim() || DEFAULT_LABEL[topic.kind] || topic.kind,
		description: topic.description ? (
			<GuidelineDescription variant="block" description={topic.description} />
		) : null,
	}))

	return (
		<GuidelineBlockFrame layout="padded" label={block.title ?? undefined}>
			{block.title ? <GuidelineHeader variant="block" title={block.title} /> : null}
			<LogoViewer
				logo={logo}
				registeredMark={imageUrl(block.registeredMark)}
				clearSpaceGuide={imageUrl(block.clearSpaceGuide)}
				minSizePx={block.minSizePx ?? 20}
				registeredMinPx={block.registeredMinPx ?? 45}
				logoRealHeightPx={block.logoRealHeightPx ?? undefined}
				topics={topics}
			/>
		</GuidelineBlockFrame>
	)
}

export default LogoViewerBlock
