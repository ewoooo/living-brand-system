import {
	COLOR,
	LAYOUT,
	ORIENTATION_LABEL,
	type Orientation,
	SYMBOL,
	WORDMARK_LABEL,
	WORDMARK_LINES,
	type Wordmark,
} from './rules'

// CI 락업 조립 위젯 — 완성 락업 SVG를 쓰지 않고 {심볼 + HD체 텍스트}를 H비율 규칙으로 조립한다.
// 목적은 두 가지: (1) 심볼+폰트만으로 정본과 같은 락업이 나오는지 확인 (2) 규칙을 시각적으로 제시.
// 🔴 자간·행간을 손으로 맞추지 않는다(자간 normal, 행간 100%). 정본과의 차이는 브랜드팀이 판정할 몫이다.
// 텍스트박스에 배경을 깔아 폰트 metrics가 만드는 영역을 드러낸다 — 그 자체가 상의 자료다.

/** H(심볼 높이) 기준 픽셀. 화면에서 읽히는 크기로 잡았다. */
const H = 120

function Lockup({ wordmark, orientation }: { wordmark: Wordmark; orientation: Orientation }) {
	const rule = LAYOUT[orientation]
	const lines = WORDMARK_LINES[wordmark]
	const isHorizontal = orientation === 'horizontal'

	return (
		<div
			className={`flex ${isHorizontal ? 'flex-row items-center' : 'flex-col items-center'}`}
			style={{ gap: H * rule.gap }}
		>
			{/* 심볼 — 기본형은 파일에 색이 박혀 있어 그대로 쓴다. */}
			{/* biome-ignore lint/performance/noImgElement: 정적 SVG라 next/image 미사용. */}
			<img
				src={SYMBOL.default}
				alt=""
				style={{ height: H, width: H * SYMBOL.aspect }}
				className="block shrink-0"
			/>

			{/* 워드마크 — font-size = 워드마크 높이(H 배수). 행간 100%, 자간 normal. */}
			<div
				className="shrink-0"
				style={{
					fontFamily: 'HD, sans-serif',
					fontWeight: 700,
					fontSize: H * rule.wordmark,
					lineHeight: 1,
					letterSpacing: 'normal',
					color: COLOR.wordmark,
					background: COLOR.textBox,
					whiteSpace: 'pre',
				}}
			>
				{lines.map((line) => (
					<div key={line}>{line}</div>
				))}
			</div>
		</div>
	)
}

export function CiLockupWidget() {
	const wordmarks: Wordmark[] = ['ko', 'en', 'hd']
	const orientations: Orientation[] = ['horizontal', 'vertical']

	return (
		<div className="flex flex-col gap-8">
			{/* 조립에 쓰인 값 — 눈대중으로 고치지 않도록 화면에 드러낸다. */}
			<dl className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-neutral-500 text-xs">
				<div>
					<dt className="inline">H</dt> <dd className="inline">{H}px</dd>
				</div>
				<div>
					<dt className="inline">가로형</dt>{' '}
					<dd className="inline">
						워드마크 {LAYOUT.horizontal.wordmark}H · 간격 {LAYOUT.horizontal.gap}H
					</dd>
				</div>
				<div>
					<dt className="inline">세로형</dt>{' '}
					<dd className="inline">
						워드마크 {LAYOUT.vertical.wordmark}H · 간격 {LAYOUT.vertical.gap}H
					</dd>
				</div>
				<div>
					<dt className="inline">웨이트</dt> <dd className="inline">Bold(700)</dd>
				</div>
			</dl>

			<div className="grid gap-x-10 gap-y-12 lg:grid-cols-3">
				{orientations.flatMap((orientation) =>
					wordmarks.map((wordmark) => (
						<figure key={`${orientation}-${wordmark}`} className="flex flex-col gap-3">
							<div className="flex min-h-[220px] items-center justify-center overflow-hidden bg-neutral-50">
								<Lockup wordmark={wordmark} orientation={orientation} />
							</div>
							<figcaption className="font-mono text-neutral-500 text-xs">
								{WORDMARK_LABEL[wordmark]} · {ORIENTATION_LABEL[orientation]}
							</figcaption>
						</figure>
					)),
				)}
			</div>
		</div>
	)
}

export default CiLockupWidget
