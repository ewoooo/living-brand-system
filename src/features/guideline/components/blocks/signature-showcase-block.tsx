import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from './common/guideline-block-frame'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type SignatureShowcase = Extract<GuidelineBlock, { blockType: 'signatureShowcase' }>

// 브랜드 시그니처/태그라인을 대형 디스플레이 타입으로 전시. 각 문구는 Tile 위에
// clamp 큰 글씨로 렌더하고, label(캡션)·note(부연)를 함께 보여준다. 캡쳐가 아니라 실제 웹폰트 조각.
export function SignatureShowcaseBlock({ block }: { block: SignatureShowcase }) {
	return (
		<GuidelineBlockFrame layout="padded">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{(block.signatures ?? []).map((signature) => (
					<figure
						key={signature.id}
						className="flex flex-col rounded-lg bg-background-secondary p-6"
					>
						{signature.label && (
							<figcaption className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wide">
								{signature.label}
							</figcaption>
						)}
						<p className="mt-4 break-keep text-foreground leading-[1.05] [font-size:clamp(1.75rem,4.5vw,3rem)]">
							{signature.phrase}
						</p>
						{signature.note && (
							<p className="mt-4 break-keep font-body text-sm font-normal text-muted-foreground leading-relaxed">
								{signature.note}
							</p>
						)}
					</figure>
				))}
			</div>
		</GuidelineBlockFrame>
	)
}
