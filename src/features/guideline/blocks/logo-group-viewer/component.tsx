import { GuidelineDescription } from '@/features/guideline/components/globals/guideline-description'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'
import { type LogoGroupItem, type LogoGroupTopic, LogoGroupView } from './view'

// 로고 그룹 뷰어 블록 — logos 배열의 이미지 URL을 해석하고 topic 설명을 서버에서 렌더해 클라이언트 뷰어에 넘긴다.
type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type LogoGroupViewerType = Extract<GuidelineBlock, { blockType: 'logoGroupViewer' }>

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

export function LogoGroupViewerBlock({ block }: { block: LogoGroupViewerType }) {
	const logos: LogoGroupItem[] = (block.logos ?? [])
		.map((row, index) => ({
			id: row.id ?? `logo-${index}`,
			label: row.label ?? null,
			logo: imageUrl(row.logo) ?? '',
			registeredMark: imageUrl(row.registeredMark),
			clearSpaceGuide: imageUrl(row.clearSpaceGuide),
			logoRealHeightPx: row.logoRealHeightPx ?? null,
			minSizePx: row.minSizePx ?? 20,
			registeredMinPx: row.registeredMinPx ?? 45,
		}))
		.filter((item) => item.logo)

	if (logos.length === 0) return null

	const topics: LogoGroupTopic[] = (block.topics ?? []).map((topic, index) => ({
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
			<LogoGroupView logos={logos} topics={topics} />
		</GuidelineBlockFrame>
	)
}

export default LogoGroupViewerBlock
