import { GuidelineImage } from '@/features/guideline/components/globals/guideline-image'
import type { ApplicationImage, BrandLogo } from '@/payload-types'
import {
	APPLICATION_TYPE_LABEL,
	type ApplicationType,
	SAMPLE_APPLICATIONS,
	SAMPLE_LOCKUP,
	SAMPLE_VARIANT_LABEL,
	SAMPLE_WORDMARK,
} from './rules'

// 분리형 로고 적용 위젯(서버) — p14 'CI 단색 분리형'. 좌: 단색 분리형 배리언트 /
// 우: 실사 적용 카드(사인물·특수효과). upload 관계 해석만 하고 인터랙션은 없다.
// 🔴 p14 본문 3단락을 갖지 않는다 — 제목·설명 산문은 Block(title·description) 소유다(docs/11 §4).
// 🔴 치수선을 그리지 않는다 — p14에는 분리형 전용 수치 규정이 없다(rules.ts 참조).
// 🔑 이미지가 없는 적용 카드는 버그가 아니라 원본의 미완성 상태다. 숨기지 말고 자리표시자로 남긴다.
type Variant = {
	id?: string | null
	logo?: number | BrandLogo | null
	label?: string | null
}

type Application = {
	id?: string | null
	type?: ApplicationType | null
	image?: number | ApplicationImage | null
	caption?: string | null
	note?: string | null
}

export function SeparatedLogoApplicationWidget({
	variants,
	apps,
}: {
	variants?: Variant[] | null
	apps?: Application[] | null
}) {
	const variantList: Variant[] = variants?.length ? variants : [{ label: SAMPLE_VARIANT_LABEL }]
	const cards: Application[] = apps?.length ? apps : SAMPLE_APPLICATIONS

	return (
		<div className="grid gap-8 md:grid-cols-2">
			<div className="flex flex-col gap-6">
				{variantList.map((variant, index) => (
					<VariantFigure key={variant.id ?? index} {...variant} />
				))}
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				{cards.map((card, index) => (
					<ApplicationCard key={card.id ?? index} {...card} />
				))}
			</div>
		</div>
	)
}

/** 배리언트 1건. 로고를 pin했으면 그 파일을, 없으면 조립 샘플을 그린다(빈 화면 금지). */
function VariantFigure({ logo, label }: Variant) {
	const picked = typeof logo === 'object' && logo ? logo : null
	const url =
		picked?.url ?? (picked?.filename ? `/api/brand-logos/file/${picked.filename}` : null)

	return (
		<figure className="flex flex-col gap-2">
			<div
				className="flex items-center justify-center p-6"
				style={{ background: SAMPLE_LOCKUP.stage }}
			>
				{url ? (
					// biome-ignore lint/performance/noImgElement: Payload upload URL이라 next/image 미사용.
					<img
						src={url}
						alt={picked?.alt ?? label ?? ''}
						className="block h-auto max-w-full"
						// pin된 로고를 조립 샘플과 비슷한 크기로 맞추는 표시 상한(규정 아님).
						style={{ maxHeight: SAMPLE_LOCKUP.symbolHeight * 2 }}
					/>
				) : (
					<SampleLockup />
				)}
			</div>
			{label && (
				<figcaption className="font-body text-muted-foreground text-xs">{label}</figcaption>
			)}
		</figure>
	)
}

/**
 * pin된 로고가 없을 때만 쓰는 조립 샘플 — 실제 저작은 variants[].logo로 brand-logos에서 pin한다.
 * 🔴 승인된 마스터 아트워크가 아니다. 단색 분리형 아트워크(mono)가 정본 비율로 놓인 형태만 보여준다.
 */
function SampleLockup() {
	return (
		<div
			className="flex items-center"
			style={{ gap: SAMPLE_LOCKUP.gap, color: SAMPLE_LOCKUP.ink }}
		>
			{/* biome-ignore lint/performance/noImgElement: 정적 SVG라 next/image 미사용. */}
			<img
				src={SAMPLE_LOCKUP.symbolSrc}
				alt=""
				className="block max-w-none shrink-0"
				style={{ height: SAMPLE_LOCKUP.symbolHeight, width: SAMPLE_LOCKUP.symbolWidth }}
			/>
			<span
				className="shrink-0"
				style={{
					fontFamily: 'HD, sans-serif',
					fontWeight: 700,
					fontSize: SAMPLE_LOCKUP.wordmarkSize,
					lineHeight: 1,
					whiteSpace: 'pre',
				}}
			>
				{SAMPLE_WORDMARK}
			</span>
		</div>
	)
}

/** 적용 카드 1건. image가 비면 자리표시자(note 문구가 있으면 그 문구)로 남긴다. */
function ApplicationCard({ type, image, caption, note }: Application) {
	const picked = typeof image === 'object' && image ? image : null

	return (
		<figure className="flex flex-col gap-2">
			<span className="w-fit rounded-full bg-muted px-2 py-0.5 font-body text-muted-foreground text-xs">
				{APPLICATION_TYPE_LABEL[type ?? 'sign']}
			</span>
			{picked?.url ? (
				<GuidelineImage
					variant="block"
					image={picked}
					alt={caption ?? ''}
					ratio="4:3"
					className="bg-muted"
					imgClassName="size-full object-cover"
				/>
			) : (
				<div className="flex aspect-4/3 items-center justify-center rounded border border-border border-dashed bg-muted p-4 text-center">
					{note && (
						<span className="font-body text-muted-foreground text-xs">{note}</span>
					)}
				</div>
			)}
			{caption && (
				<figcaption className="font-body font-normal text-muted-foreground text-sm">
					{caption}
				</figcaption>
			)}
		</figure>
	)
}

export default SeparatedLogoApplicationWidget
