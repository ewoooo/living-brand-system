import config from '@payload-config'
import { getPayload } from 'payload'
import { GuidelineImage } from '@/features/guideline/components/globals/guideline-image'
import { cn } from '@/lib/utils'
import { IMAGE_RATIO_CLASS_NAMES, type ImageRatio } from '@/types/image-ratio'
import { type LogoRef, type LogoSources, resolveLogoSet } from '../logo-set'
import {
	BAND_OPACITY,
	type ColorPreset,
	colorPreset,
	type PresetKey,
	TYPO_FONT_SIZE,
	TYPO_LINE_HEIGHT,
	TYPO_MAX_WIDTH,
	TYPO_SAMPLE_LINES,
	TYPO_WEIGHT,
	type TypoPreset,
	typoPreset,
} from './presets'

// Do/Don't 위젯(서버) — 예시마다 이미지 또는 코드 프리셋(컬러 패널·타이포 판)을 그리고,
// 순번 제목·kind 표식·캡션을 붙인다.
// 표현은 SVG-54(COLOR 사용 금지)의 판을 따른다: 판형 위가 아니라 위쪽 헤더줄에 순번 제목과 표식을 둔다.
type Kind = 'do' | 'ok' | 'dont'
type Example = {
	id?: string | null
	image?: number | { url?: string | null; alt?: string | null; name?: string | null } | null
	preset?: PresetKey | null
	kind: Kind
	caption?: string | null
}

/** 표식과 캡션 색. 금지만 빨강이고 나머지는 중립이다 — 판형 밖 헤더줄이라 배지 배경을 쓰지 않는다. */
const KIND_STYLE: Record<Kind, { symbol: string; mark: string; caption: string }> = {
	do: { symbol: '✓', mark: 'text-green-700', caption: 'text-muted-foreground' },
	ok: { symbol: '△', mark: 'text-muted-foreground', caption: 'text-muted-foreground' },
	dont: { symbol: '✕', mark: 'text-destructive', caption: 'text-destructive' },
}

const COLUMN_CLASS = {
	'2': 'lg:grid-cols-2',
	'3': 'lg:grid-cols-3',
	'4': 'lg:grid-cols-4',
} as const

/** 로고가 패널 폭에서 차지하는 비율. SVG-54에서 154 / 456(가로형 기준). */
const LOGO_WIDTH = '33.8%'
/** 세로형 로고를 고르면 폭 기준만으로는 패널을 넘는다. 높이 상한을 둬서 그때는 높이가 기준이 된다. */
const LOGO_MAX_HEIGHT = '62%'

export async function DoDontWidget({
	imageRatio,
	columns,
	itemLabel,
	logo,
	examples,
}: {
	imageRatio?: ImageRatio | null
	columns?: keyof typeof COLUMN_CLASS | null
	itemLabel?: string | null
	logo?: LogoRef
	examples?: Example[] | null
} = {}) {
	const items = examples ?? []
	if (items.length === 0) return null

	// 로고를 얹는 건 컬러 패널뿐이다. 이미지·타이포 예시만 있는 페이지에서는 조회를 하지 않는다.
	const usesLogo = items.some(
		(example) => !example.image && example.preset && colorPreset(example.preset),
	)
	const logos = usesLogo ? await resolveLogoSet(await getPayload({ config }), logo) : null

	const ratio = imageRatio ?? '16:9'
	const label = itemLabel?.trim()

	return (
		<ul
			className={
				items.length <= 1
					? 'grid w-full gap-x-6 gap-y-8'
					: cn('grid w-full gap-x-6 gap-y-8 sm:grid-cols-2', COLUMN_CLASS[columns ?? '3'])
			}
		>
			{items.map((example, index) => {
				const style = KIND_STYLE[example.kind] ?? KIND_STYLE.dont
				return (
					<li key={example.id ?? index} className="flex flex-col gap-3">
						{label ? (
							<div className="flex items-center justify-between gap-2">
								<h3 className="font-body font-semibold text-sm tracking-wide">
									{label} {index + 1}
								</h3>
								<span
									aria-hidden
									className={cn('font-body text-lg leading-none', style.mark)}
								>
									{style.symbol}
								</span>
							</div>
						) : null}

						<Figure example={example} ratio={ratio} logos={logos} />

						{example.caption ? (
							<p className={cn('font-body text-xs leading-snug', style.caption)}>
								{example.caption}
							</p>
						) : null}
					</li>
				)
			})}
		</ul>
	)
}

/**
 * 이미지가 있으면 이미지, 없으면 프리셋 키가 가리키는 판. 어느 것도 없으면 캡션만 남는다.
 * 컬러·타이포 프리셋은 admin에서 select 하나를 나눠 쓰므로 키로 갈린다.
 */
function Figure({
	example,
	ratio,
	logos,
}: {
	example: Example
	ratio: ImageRatio
	logos: LogoSources | null
}) {
	if (example.image) {
		return (
			<GuidelineImage
				variant="block"
				image={example.image}
				alt={example.caption || ''}
				ratio={ratio}
				imgClassName="size-full object-cover"
			/>
		)
	}
	if (!example.preset) return null

	const color = colorPreset(example.preset)
	if (color) return <ColorPanel preset={color} ratio={ratio} logos={logos} />

	const typo = typoPreset(example.preset)
	return typo ? <TypoPanel preset={typo} ratio={ratio} /> : null
}

/** 배경 패널 + (있으면) 겹치는 띠 + 가운데 로고. */
function ColorPanel({
	preset,
	ratio,
	logos,
}: {
	preset: ColorPreset
	ratio: ImageRatio
	logos: LogoSources | null
}) {
	return (
		<div
			className={cn(
				'relative w-full overflow-hidden border border-border',
				IMAGE_RATIO_CLASS_NAMES[ratio],
			)}
			style={{ background: preset.panel }}
		>
			{preset.bands?.map((band) => (
				<div
					key={`${band.color}-${band.leftPct}`}
					className="absolute inset-y-0"
					style={{
						left: `${band.leftPct}%`,
						width: `${band.widthPct}%`,
						backgroundColor: band.color,
						opacity: BAND_OPACITY,
					}}
				/>
			))}
			<div className="absolute inset-0 grid place-items-center">
				<LogoMark logo={preset.logo} logos={logos} />
			</div>
		</div>
	)
}

/**
 * 타이포 위반 판 — 위반이 글자 자체라 컬러 패널과 같은 비율의 중립면 위에 문구만 가운데 놓는다.
 * 여섯 칸이 같은 문구·같은 크기라 칸마다 다른 것은 위반뿐이다.
 */
function TypoPanel({ preset, ratio }: { preset: TypoPreset; ratio: ImageRatio }) {
	return (
		<div
			className={cn(
				'grid w-full place-items-center overflow-hidden border border-border',
				IMAGE_RATIO_CLASS_NAMES[ratio],
			)}
			// 글자를 셀이 아니라 이 판 기준으로 잰다 — 열 수가 바뀌어도 판 안의 그림이 같아진다.
			style={{ containerType: 'inline-size' }}
		>
			<p
				className="text-center text-foreground"
				style={{
					fontFamily: preset.fontFamily,
					// 🔴 자간이 em이라 크기를 반드시 여기(문단)에 준다. 크기가 줄에만 있으면 em이 상속된
					//    16px 기준으로 풀려 자간 위반이 거의 안 보인다.
					fontSize: TYPO_FONT_SIZE,
					fontWeight: TYPO_WEIGHT,
					letterSpacing: preset.letterSpacing,
					lineHeight: TYPO_LINE_HEIGHT,
					transform: preset.transform,
					// 넘치면 잘려서 무슨 위반인지 안 보인다. 잘리기 전에 줄바꿈으로 흘린다.
					maxWidth: TYPO_MAX_WIDTH,
				}}
			>
				{TYPO_SAMPLE_LINES.map((line, index) => (
					// 줄 크기는 문단 기준 배수다(기본 1em). 한 문장 안 크기 혼재가 이 배수로 표현된다.
					<span
						key={line}
						className="block"
						style={{ fontSize: `${preset.lineScale?.[index] ?? 1}em` }}
					>
						{line}
					</span>
				))}
			</p>
		</div>
	)
}

function LogoMark({ logo, logos }: { logo: ColorPreset['logo']; logos: LogoSources | null }) {
	if (!logos) return null

	if (logo.fill) {
		// 단색형은 fill 속성이 없는 실루엣이라 mask로 색을 입힌다 — 여기서는 그 색이 "지정 외 컬러"다.
		// contain에 맡기면 로고의 실제 가로세로비를 몰라도 폭·높이 중 작은 쪽이 알아서 기준이 된다.
		if (!logos.mono) return null
		return (
			<div
				role="img"
				aria-label={`지정되지 않은 색(${logo.fill})으로 칠한 로고`}
				style={{
					width: LOGO_WIDTH,
					height: LOGO_MAX_HEIGHT,
					backgroundColor: logo.fill,
					opacity: logo.opacity,
					maskImage: `url(${logos.mono})`,
					maskRepeat: 'no-repeat',
					maskPosition: 'center',
					maskSize: 'contain',
					WebkitMaskImage: `url(${logos.mono})`,
					WebkitMaskRepeat: 'no-repeat',
					WebkitMaskPosition: 'center',
					WebkitMaskSize: 'contain',
				}}
			/>
		)
	}

	const src = logo.variant === 'white' ? logos.white : logos.default
	if (!src) return null
	return (
		// biome-ignore lint/performance/noImgElement: Payload upload URL이라 next/image 미사용.
		<img
			src={src}
			alt=""
			draggable={false}
			// preflight의 `img{max-width:100%}`가 폭 지정을 셀 폭으로 되돌리므로 max-w-none이 필요하다.
			className="h-auto max-w-none object-contain"
			style={{ width: LOGO_WIDTH, maxHeight: LOGO_MAX_HEIGHT, opacity: logo.opacity }}
		/>
	)
}

export default DoDontWidget
