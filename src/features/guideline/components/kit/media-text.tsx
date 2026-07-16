/**
 * 이미지 + 설명 — 가이드라인 본문에서 가장 자주 쓰는 워크호스. 페이지에 그대로 드롭인.
 * `caption`만 주면 캡션형, `heading`(+`body`)을 주면 제목+본문형.
 *
 * @example 캡션형 — 이미지 위, 짧은 설명 아래
 * <MediaText image={url} alt="키 비주얼" caption="식물성 원료의 생명력을 담은 메인 이미지." />
 *
 * @example 제목+본문 — md↑에서 좌우 2단
 * <MediaText
 *   layout="side"
 *   image={url}
 *   heading="로고 사용 원칙"
 *   body={['첫 문단.', '둘째 문단.']}
 * />
 */
export function MediaText({
	image,
	alt,
	heading,
	body,
	layout = 'stack',
	caption,
}: {
	/** 이미지 URL — S3·로컬·data-uri 등 무엇이든. */
	image: string
	/** 대체 텍스트. 생략 시 heading→caption 순으로 대체. */
	alt?: string
	/** 굵은 제목(선택). 주면 제목+본문형이 된다. */
	heading?: string
	/** 본문 — 문자열 하나 또는 문단 배열. */
	body?: string | string[]
	/** 'stack'=이미지 위·텍스트 아래(기본), 'side'=md↑ 좌우 2단. */
	layout?: 'stack' | 'side'
	/** 짧은 캡션(선택). heading 없이 이것만 주면 캡션형. */
	caption?: string
}) {
	const paragraphs = typeof body === 'string' ? [body] : (body ?? [])
	const side = layout === 'side'

	return (
		<figure
			className={`m-0 rounded-lg bg-background-secondary p-5 md:p-6 ${
				side ? 'md:flex md:items-start md:gap-6' : ''
			}`}
		>
			<div className={side ? 'md:w-1/2 md:shrink-0' : ''}>
				{/* biome-ignore lint/performance/noImgElement: 임의 원격/데이터 URL이라 next/image 미사용. */}
				<img
					src={image}
					alt={alt ?? heading ?? caption ?? ''}
					className="aspect-video w-full bg-fill-muted object-cover"
				/>
			</div>

			{(heading || paragraphs.length > 0 || caption) && (
				<figcaption className={side ? 'mt-4 md:mt-0 md:flex-1' : 'mt-4'}>
					{heading && (
						<h4
							className="type-title-3-emphasized text-foreground"
							style={{ fontWeight: 700 }}
						>
							{heading}
						</h4>
					)}
					{paragraphs.map((p) => (
						<p
							key={p}
							className="type-body mt-2 break-keep text-foreground-muted leading-relaxed first:mt-0"
						>
							{p}
						</p>
					))}
					{caption && (
						<p className="type-caption-1 mt-2 text-foreground-muted first:mt-0">
							{caption}
						</p>
					)}
				</figcaption>
			)}
		</figure>
	)
}

const placeholder = (label: string, bg = '#737373', fg = '#FFFFFF') =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="${bg}"/><text x="320" y="192" font-family="sans-serif" font-size="28" fill="${fg}" text-anchor="middle">${label}</text></svg>`,
	)}`

export function MediaTextDemo() {
	return (
		<div className="flex flex-col gap-5">
			<MediaText
				layout="side"
				image={placeholder('Logo on Red')}
				alt="에센허브 기본 로고 사용 예시"
				heading="로고 사용 원칙 · Logo Usage"
				body={[
					'에센허브 로고는 시그니처 컬러 Essenherb Red(#EA5343) 위에 반전 화이트로 사용하는 것을 기본으로 합니다.',
					'배경 대비가 충분하지 않은 경우 단색 배경을 먼저 확보한 뒤 로고를 얹습니다. 사진 위 직접 배치는 지양합니다.',
				]}
			/>

			<MediaText
				layout="stack"
				image={placeholder('Key Visual', '#262626')}
				alt="브랜드 키 비주얼"
				caption="키 비주얼 — 식물성 원료의 생명력을 담은 메인 이미지. Vegan skincare, rooted in nature."
			/>

			<div className="grid gap-5 md:grid-cols-2">
				<MediaText
					layout="side"
					image={placeholder('Do', '#525252')}
					alt="여백 확보 예시"
					heading="충분한 여백"
					caption="로고 주위 최소 여백(x)을 확보한다."
				/>
				<MediaText
					layout="side"
					image={placeholder('Don’t', '#404040')}
					alt="여백 부족 예시"
					heading="여백 침범"
					caption="다른 요소가 여백을 침범하지 않도록 한다."
				/>
			</div>
		</div>
	)
}
