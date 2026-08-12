'use client'

import { useEffect, useState } from 'react'
import {
	BRAND_FONT_STACK,
	LANGUAGES,
	type LanguageKey,
	LEADING,
	SAMPLE_PARAGRAPH,
	TIER_SIZE,
	TIERS,
} from '../brand-typeface'
import { HAIRLINE_CELL, HAIRLINE_GRID } from '../hairline'
import { SPEC_READOUT, WIDGET_CAPTION } from '../readout'

// 같은 한 덩어리 본문을 언어만 바꿔 가며 본다. 언어가 바뀌면 글자 밀도(회색도)가 달라지고,
// 그래서 규정이 정한 행간도 달라진다 — 그 두 가지가 같은 화면에 함께 있어야 요점이 전달된다.
// 그래서 문단 위에 항상 적용 중인 행간 규정을 적어 둔다.

/** 위계가 없는 한 덩어리를 다루므로 본문 단 하나만 쓴다(Head/Sub는 다른 위젯 몫이다). */
const TIER = 'body'

/** 굵기도 규정에서 읽는다 — 폰트 파일이 바뀌어도 이 위젯은 안 고치게. */
const BODY_WEIGHT = TIERS.find((tier) => tier.key === TIER)?.weight

/**
 * 브랜드 서체 스택의 첫 이름(폴백 제외). 이 서체 자신이 글자를 그리는지 잴 때 쓴다.
 * 🔴 canvas의 `font`는 CSS 변수를 못 읽으므로 스택을 통째로 넘기면 안 된다.
 */
const BRAND_FAMILY = BRAND_FONT_STACK.split(',')[0].trim()
/** 한글 대표 글자. 서브셋 서체는 한글을 통째로 빼거나 통째로 갖는다. */
const PROBE_CHAR = '가'
/** 크게 재야 두 서체의 폭이 반올림으로 같아질 확률이 줄어든다. */
const PROBE_SIZE = 64

export function TypeLanguageView({
	initialLanguage,
	layout,
}: {
	initialLanguage: LanguageKey
	layout: 'single' | 'compare'
}) {
	const [language, setLanguage] = useState<LanguageKey>(initialLanguage)
	const brandHasHangul = useBrandHasHangul()

	const shown: LanguageKey[] = layout === 'compare' ? LANGUAGES.map((l) => l.key) : [language]
	// 국문이 폴백 서체로 그려지는 동안에는 회색도 비교가 성립하지 않는다. 그 사실을 숨기지 않는다.
	const warnFallback = brandHasHangul === false && shown.includes('ko')

	return (
		<div className="flex w-full flex-col gap-3">
			{layout === 'single' ? (
				// 선택 상태를 색만으로 구분하지 않는다 — 굵기와 밑줄이 같이 바뀐다(logo-grid-spec과 같은 형태).
				<div className="flex gap-1">
					{LANGUAGES.map((option) => {
						const on = language === option.key
						return (
							<button
								key={option.key}
								type="button"
								aria-pressed={on}
								onClick={() => setLanguage(option.key)}
								className={`border-b-2 px-3 py-1 font-body text-sm focus-visible:outline-2 ${
									on
										? 'border-foreground font-semibold text-foreground'
										: 'border-transparent font-normal text-muted-foreground hover:bg-muted'
								}`}
							>
								{option.label}
							</button>
						)
					})}
				</div>
			) : null}

			<div
				className={`grid w-full ${HAIRLINE_GRID}`}
				style={{
					// 🔴 임의값 Tailwind 클래스는 CSS가 안 나오는 일이 있어 인라인으로 준다.
					//    auto-fit이라 셀이 좁으면 스스로 줄을 접는다 — 브레이크포인트를 지어내지 않는다.
					// 🔴 `min(15rem, 100%)` 필수 — 맨 `15rem`은 셀보다 큰 하한이라 줄을 접어도 안 줄고
					//    셀 밖으로 삐져나간다. Block의 배치 그리드는 `repeat(cols, minmax(0,1fr))`이고
					//    좁은 화면에서도 열이 안 접히므로 3열 × 모바일이면 셀이 15rem 아래로 내려간다.
					gridTemplateColumns: 'repeat(auto-fit, minmax(min(15rem, 100%), 1fr))',
				}}
			>
				{shown.map((key) => (
					<LanguagePanel key={key} language={key} />
				))}
			</div>

			{warnFallback ? (
				// role="status" — 서체 로딩이 끝난 뒤에 나타나는 줄이라 스크린리더에도 전달돼야 한다.
				<p role="status" className={WIDGET_CAPTION}>
					지금 붙어 있는 브랜드 서체에 한글 글리프가 없어 국문은 본문 서체로 대체해 보여
					줍니다. 회색도 비교는 서체가 들어온 뒤 다시 확인해야 합니다.
				</p>
			) : null}
		</div>
	)
}

export default TypeLanguageView

/**
 * 한 언어의 본문 한 덩어리와 그 언어에 적용된 행간 규정.
 *
 * 🔴 규정은 범위이고 화면은 한 값을 그려야 한다. 하한을 쓴다 — 각 언어가 규정상 가장 촘촘한 상태라
 *    언어 간 회색도 차이가 가장 크게 드러난다. 하한이 규정 전부가 아니라는 것은 범위를 함께 적어 남긴다.
 */
function LanguagePanel({ language }: { language: LanguageKey }) {
	const [min, max] = LEADING[language][TIER]
	const label = LANGUAGES.find((option) => option.key === language)?.label

	return (
		<figure className={`flex flex-col ${HAIRLINE_CELL}`}>
			<figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-border border-b px-4 py-2 font-body text-xs">
				<span className="font-semibold text-foreground">{label}</span>
				<span className={`${SPEC_READOUT} text-xs`}>
					행간 {min}–{max}% · {min}% 적용
				</span>
			</figcaption>
			<p
				className="break-keep px-4 py-5"
				style={{
					fontFamily: BRAND_FONT_STACK,
					fontWeight: BODY_WEIGHT,
					fontSize: TIER_SIZE[TIER],
					lineHeight: min / 100,
				}}
			>
				{SAMPLE_PARAGRAPH[language][TIER]}
			</p>
		</figure>
	)
}

/**
 * 지금 배포된 브랜드 서체가 한글을 그리는지 런타임에 잰다.
 *
 * 🔴 "한글이 없다"를 상수로 박지 않는 이유: 제대로 된 서체가 곧 들어오고, 그때 이 위젯을 고치는 사람이
 *    없으면 화면에 거짓말이 남는다. 서체가 들어오면 안내가 저절로 사라지게 한다.
 *
 * null은 "아직 모름"이다 — 서버 렌더와 첫 페인트에서 안내를 그리지 않아 hydration이 어긋나지 않는다.
 */
function useBrandHasHangul() {
	const [hasHangul, setHasHangul] = useState<boolean | null>(null)

	useEffect(() => {
		let alive = true
		// 웹폰트가 붙기 전에 재면 폴백끼리 비교하게 된다. 로드가 끝난 뒤에 잰다.
		document.fonts.ready.then(() => {
			if (alive) setHasHangul(brandDrawsGlyph(PROBE_CHAR))
		})
		return () => {
			alive = false
		}
	}, [])

	return hasHangul
}

/**
 * 브랜드 서체가 이 글자를 직접 그리는가.
 * 같은 글자를 `브랜드→monospace` 폴백으로 한 번, `monospace`만으로 한 번 재서 폭이 같으면
 * 브랜드 서체가 그 글자를 그리지 못해 폴백이 대신 그린 것이다.
 */
function brandDrawsGlyph(char: string) {
	const context = document.createElement('canvas').getContext('2d')
	// 못 재는 환경에서는 안내를 띄우지 않는다. 근거 없는 경고보다 침묵이 낫다.
	if (!context) return true

	const widthOf = (family: string) => {
		context.font = `${PROBE_SIZE}px ${family}`
		return context.measureText(char).width
	}
	return widthOf(`${BRAND_FAMILY}, monospace`) !== widthOf('monospace')
}
