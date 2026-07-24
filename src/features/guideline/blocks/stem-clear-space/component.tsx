import config from '@payload-config'
import { getPayload } from 'payload'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'
import { ClearSpaceView } from './view'

// 줄기 기반 클리어스페이스 블록 — brand-logos에서 로고 URL을 해석해 클라이언트 뷰어(ClearSpaceView)에 넘긴다.
// 측정값(stemRatio·stemX)·배수는 블록 필드가 소유한다.
type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type StemClearSpaceType = Extract<GuidelineBlock, { blockType: 'stemClearSpace' }>

export async function StemClearSpaceBlock({ block }: { block: StemClearSpaceType }) {
	const logo = block.logo
	let src: string | null = null

	if (logo && typeof logo === 'object') {
		src = logo.url ?? (logo.filename ? `/api/brand-logos/file/${logo.filename}` : null)
	} else if (typeof logo === 'number') {
		const payload = await getPayload({ config })
		const doc = await payload.findByID({ collection: 'brand-logos', id: logo, depth: 0 })
		src = doc.url ?? (doc.filename ? `/api/brand-logos/file/${doc.filename}` : null)
	}

	if (!src) return null

	return (
		<GuidelineBlockFrame layout="padded" label={block.title ?? undefined}>
			{block.title ? <GuidelineHeader variant="block" title={block.title} /> : null}
			<ClearSpaceView
				logoSrc={src}
				stemRatio={block.stemRatio ?? 0.025}
				stemX={block.stemX ?? undefined}
				multiplier={block.multiplier ?? 3}
			/>
		</GuidelineBlockFrame>
	)
}

export default StemClearSpaceBlock
