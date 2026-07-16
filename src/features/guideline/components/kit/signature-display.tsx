// 브랜드 시그니처/태그라인을 대형 디스플레이 타입으로 전시. 각 문구는 Carbon Tile 위에
// clamp 큰 글씨로 렌더하고, label(캡션)·note(부연)를 함께 보여준다. 캡쳐가 아니라 실제 웹폰트 조각.

export type Signature = {
	/** 카드 상단 캡션(선택) — 예: 'Brand Signature', 'Tagline'. 대문자 소형 라벨로 표시. */
	label?: string
	/** 핵심 문구 — clamp 대형 타입으로 크게 렌더되는 주인공. key로도 쓰이니 목록 내 유일해야 함. */
	phrase: string
	/** 부연 설명(선택) — 문구 아래 작은 본문으로 맥락/용도를 덧붙인다. */
	note?: string
}

/**
 * 브랜드 시그니처/태그라인을 대형 디스플레이 타입으로 전시 — 로고 이미지가 아니라 실제 웹폰트 조각.
 * 각 문구를 카드에 clamp 큰 글씨로 얹고 label(캡션)·note(부연)를 함께 보여준다.
 * 이미지 위 짧은 설명이 필요하면 MediaText를, 문구 여러 개의 전시가 목적이면 이걸 쓴다.
 *
 * @example 시그니처 하나
 * <SignatureDisplay signatures={[{ label: 'Brand Signature', phrase: 'Essence of Herb', note: '…' }]} />
 *
 * @example 여러 문구를 2단 그리드로
 * <SignatureDisplay signatures={[
 *   { label: 'Tagline', phrase: 'Daily Skincare Ritual' },
 *   { label: 'Sign-off', phrase: 'Essenherb, Naturally' },
 * ]} />
 */
export function SignatureDisplay({
	signatures,
}: {
	/** 전시할 문구 목록 — 각 항목이 카드 하나. md↑에서 2열 그리드로 배치된다. */
	signatures: Signature[]
}) {
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
