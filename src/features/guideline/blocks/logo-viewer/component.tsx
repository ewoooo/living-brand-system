import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'
import { LogoViewer } from './view'

// 로고 뷰어 블록 — application-images 업로드 3장의 URL을 뽑아 클라이언트 뷰어에 넘긴다.
type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type LogoViewerType = Extract<GuidelineBlock, { blockType: 'logoViewer' }>

// 업로드 관계값(populated 객체)에서 표시 URL을 뽑는다. same-origin 파일 라우트로 폴백.
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

	return (
		<GuidelineBlockFrame layout="padded" label={block.title ?? undefined}>
			{block.title ? <GuidelineHeader variant="block" title={block.title} /> : null}
			<LogoViewer
				logo={logo}
				registeredMark={imageUrl(block.registeredMark)}
				clearSpaceGuide={imageUrl(block.clearSpaceGuide)}
			/>
		</GuidelineBlockFrame>
	)
}

export default LogoViewerBlock
