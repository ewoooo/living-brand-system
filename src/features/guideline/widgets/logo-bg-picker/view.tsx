'use client'

import { useState } from 'react'
import type { BrandBackground } from '../brand-background'
import type { LogoSources } from '../logo-set'

// 한 배경 위에 CI 두 표현을 나란히 올리고, 구석의 스와치 picker로 배경을 갈아 끼운다.
// 컨트롤이 하나라 두 표현이 같은 배경에서 어떻게 갈리는지가 한눈에 보인다 — 드래그 위젯이 열을
// 나눠 놓아서 못 하던 것이다.

/** 로고가 판 폭에서 차지하는 비율. 둘이 나란히 서므로 각각 이만큼이다. */
const LOGO_WIDTH = '26%'

export function LogoBgPickerView({
	backgrounds,
	logos,
}: {
	backgrounds: BrandBackground[]
	logos: LogoSources
}) {
	const [index, setIndex] = useState(0)
	const background = backgrounds[Math.min(index, backgrounds.length - 1)]
	if (!background) return null

	const foreground = background.monoFill === 'black' ? '#000000' : '#FFFFFF'
	const fullColor = pickFullColor(background, logos)

	return (
		<div className="flex w-full flex-col gap-2">
			<div
				className="relative w-full overflow-hidden rounded-md border border-border transition-colors"
				style={{ aspectRatio: '16 / 7', backgroundColor: background.hex }}
			>
				{/* CI 두 표현. 같은 배경을 공유하므로 규정 차이가 나란히 드러난다. */}
				<div className="absolute inset-0 grid grid-cols-2 place-items-center">
					<Slot label={fullColor.label} foreground={foreground}>
						{fullColor.src ? (
							// biome-ignore lint/performance/noImgElement: Payload upload URL이라 next/image 미사용.
							<img
								src={fullColor.src}
								alt=""
								draggable={false}
								// preflight의 `img{max-width:100%}`가 폭 지정을 셀 폭으로 되돌린다.
								className="h-auto max-w-none"
								style={{ width: LOGO_WIDTH }}
							/>
						) : (
							<Forbidden foreground={foreground} />
						)}
					</Slot>

					<Slot
						label={`단색분리형 (${background.monoFill === 'black' ? '검정' : '흰색'})`}
						foreground={foreground}
					>
						{logos.mono ? (
							<div
								role="img"
								aria-label="CI 단색분리형"
								// 단색형은 fill 속성이 없는 실루엣이라 mask로 색을 입힌다.
								// 🔴 색 파생이 아니다 — 단색형은 원래 한 색이고 그 색을 규정이 정해준다.
								className="h-16"
								style={{
									width: LOGO_WIDTH,
									backgroundColor: foreground,
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
						) : null}
					</Slot>
				</div>

				{/* picker는 판 구석에 얹는다. 등록된 색만 고를 수 있어 판정이 항상 규정 그대로다. */}
				<div className="absolute right-3 bottom-3 flex max-w-[45%] flex-wrap justify-end gap-1">
					{backgrounds.map((candidate, i) => (
						<button
							key={candidate.id}
							type="button"
							onClick={() => setIndex(i)}
							aria-pressed={i === index}
							aria-label={`${candidate.name} 배경으로 보기`}
							title={`${candidate.name} · ${candidate.hex}`}
							className="size-5 cursor-pointer rounded-[3px] outline-none ring-offset-1 transition-transform hover:scale-110 focus-visible:ring-2"
							style={{
								backgroundColor: candidate.hex,
								// 배경과 같은 색인 스와치가 사라지지 않게 테두리를 전경색으로 준다.
								boxShadow:
									i === index
										? `0 0 0 2px ${background.hex}, 0 0 0 3.5px ${foreground}`
										: `inset 0 0 0 1px ${foreground}40`,
							}}
						/>
					))}
				</div>
			</div>

			<p className="px-1 font-body text-muted-foreground text-xs">
				오른쪽 아래에서 배경색을 골라 보세요. <b>{background.name}</b> 위에서는{' '}
				{fullColor.label}
				{fullColor.src ? '을(를) 씁니다' : ' — 기본형도 WHITE 워드마크도 쓸 수 없습니다'}.
			</p>
		</div>
	)
}

/** 배경이 정한 대로 기본형 → WHITE 워드마크 순으로 고른다. 둘 다 불가면 src가 없다. */
function pickFullColor(background: BrandBackground, logos: LogoSources) {
	if (background.allowsFullColor) return { src: logos.default, label: 'CI 기본형' }
	if (background.allowsWhiteWordmark) return { src: logos.white, label: 'CI WHITE 워드마크' }
	return { src: null, label: '사용 불가' }
}

/** 로고 하나와 그 아래 라벨. 무엇이 왜 쓰였는지를 화면에 남긴다. */
function Slot({
	label,
	foreground,
	children,
}: {
	label: string
	foreground: string
	children: React.ReactNode
}) {
	return (
		<div className="flex flex-col items-center gap-3">
			{children}
			<span className="font-body text-xs opacity-70" style={{ color: foreground }}>
				{label}
			</span>
		</div>
	)
}

/** 이 배경에는 올릴 수 있는 기본형 계열이 없다. 규정이 금지라는 사실 자체가 정보다. */
function Forbidden({ foreground }: { foreground: string }) {
	return (
		<span
			role="img"
			aria-label="이 배경에는 사용할 수 없습니다"
			className="grid size-10 place-items-center rounded-full font-body text-lg"
			style={{ color: foreground, boxShadow: `inset 0 0 0 1px ${foreground}` }}
		>
			✕
		</span>
	)
}
