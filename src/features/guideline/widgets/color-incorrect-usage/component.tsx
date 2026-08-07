import config from '@payload-config'
import { getPayload } from 'payload'
import { type LogoRef, type LogoSources, resolveLogoSet } from '../logo-set'
import { BAND_OPACITY, MISUSES, type Misuse } from './misuses'

// 위젯(서버): 로고 3종 URL만 받아 금지 6종 카드를 그린다. 인터랙션이 없어 view.tsx가 없다.
// 위반이 색으로만 표현되므로 나쁜예시 이미지가 필요 없다 — 패널 배경과 로고 색을 규정대로 어긋나게 둔다.

/** 로고가 패널 폭에서 차지하는 비율. SVG-54에서 154 / 456(가로형 기준). */
const LOGO_WIDTH = '33.8%'
/** 세로형 로고를 고르면 폭 기준만으로는 패널을 넘는다. 높이 상한을 둬서 그때는 높이가 기준이 된다. */
const LOGO_MAX_HEIGHT = '62%'

export async function ColorIncorrectUsageWidget({ logo }: { logo?: LogoRef } = {}) {
	const payload = await getPayload({ config })
	const logos = await resolveLogoSet(payload, logo)

	return (
		<ul className="grid w-full grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
			{MISUSES.map((misuse) => (
				<li key={misuse.no} className="flex flex-col gap-3">
					<div className="flex items-center justify-between gap-2">
						<h3 className="font-body font-semibold text-sm tracking-wide">
							INCORRECT USAGE {misuse.no}
						</h3>
						<span
							aria-hidden
							className="font-body text-destructive text-lg leading-none"
						>
							✕
						</span>
					</div>

					<Panel misuse={misuse} logos={logos} />

					<p className="font-body text-destructive text-xs leading-snug">
						{misuse.caption}
					</p>

					{misuse.needsBrandReview ? (
						// 브랜드팀이 원본에 "수정필요"로 표시한 칸이다. 완성된 예시인 척하지 않는다.
						<p className="font-body text-muted-foreground text-xs leading-snug">
							⚠ 브랜드팀 확인 필요 — 원본 아트워크가 이 문구와 맞지 않습니다.
						</p>
					) : null}
				</li>
			))}
		</ul>
	)
}

/** 배경 패널 + (있으면) 겹치는 띠 + 가운데 로고. 판형은 원본과 같은 456:277. */
function Panel({ misuse, logos }: { misuse: Misuse; logos: LogoSources }) {
	return (
		<div
			className="relative w-full overflow-hidden rounded-md border border-border"
			style={{ aspectRatio: '456 / 277', background: misuse.panel }}
		>
			{misuse.bands?.map((band) => (
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
				<LogoMark logo={misuse.logo} logos={logos} />
			</div>
		</div>
	)
}

function LogoMark({ logo, logos }: { logo: Misuse['logo']; logos: LogoSources }) {
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

export default ColorIncorrectUsageWidget
