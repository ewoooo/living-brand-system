// 브랜드 시그니처/태그라인을 대형 디스플레이 타입으로 전시. 각 문구는 Carbon Tile 위에
// clamp 큰 글씨로 렌더하고, label(캡션)·note(부연)를 함께 보여준다. 캡쳐가 아니라 실제 웹폰트 조각.

export type Signature = { label?: string; phrase: string; note?: string }

export function SignatureDisplay({ signatures }: { signatures: Signature[] }) {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
			{signatures.map((sig) => (
				<figure
					key={sig.phrase}
					className="flex flex-col rounded-lg bg-background-secondary p-6"
				>
					{sig.label && (
						<figcaption className="type-caption-1-emphasized text-foreground-muted uppercase tracking-wide">
							{sig.label}
						</figcaption>
					)}
					<p className="mt-4 break-keep text-foreground leading-[1.05] [font-size:clamp(1.75rem,4.5vw,3rem)]">
						{sig.phrase}
					</p>
					{sig.note && (
						<p className="type-callout mt-4 break-keep text-foreground-muted leading-relaxed">
							{sig.note}
						</p>
					)}
				</figure>
			))}
		</div>
	)
}

export function SignatureDisplayDemo() {
	return (
		<SignatureDisplay
			signatures={[
				{
					label: 'Brand Signature',
					phrase: 'Essence of Herb',
					note: '피부 본질에 집중하는 식물성 비건 스킨케어. 브랜드 아이덴티티의 중심 문구.',
				},
				{
					label: 'Tagline',
					phrase: 'Daily Skincare Ritual',
					note: '매일의 루틴을 하나의 의식으로. 커뮤니케이션 전반에 쓰는 태그라인.',
				},
				{
					label: 'Sign-off',
					phrase: 'Essenherb, Naturally',
					note: '광고·패키지 마무리 서명. 자연스러움을 강조하는 클로징 카피.',
				},
			]}
		/>
	)
}
