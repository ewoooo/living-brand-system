'use client'

import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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
import { SPEC_READOUT } from '../readout'

// 같은 한 덩어리 본문을 언어만 바꿔 가며 본다. 언어가 바뀌면 글자 밀도(회색도)가 달라지고,
// 그래서 규정이 정한 행간도 달라진다 — 그 두 가지가 같은 화면에 함께 있어야 요점이 전달된다.
// 그래서 문단 위에 항상 적용 중인 행간 규정을 적어 둔다.

/** 위계가 없는 한 덩어리를 다루므로 본문 단 하나만 쓴다(Head/Sub는 다른 위젯 몫이다). */
const TIER = 'body'

/** 굵기도 규정에서 읽는다 — 폰트 파일이 바뀌어도 이 위젯은 안 고치게. */
const BODY_WEIGHT = TIERS.find((tier) => tier.key === TIER)?.weight

export function TypeLanguageView({
	initialLanguage,
	layout,
}: {
	initialLanguage: LanguageKey
	layout: 'single' | 'compare'
}) {
	const [language, setLanguage] = useState<LanguageKey>(initialLanguage)

	const shown: LanguageKey[] = layout === 'compare' ? LANGUAGES.map((l) => l.key) : [language]

	return (
		<div className="flex w-full flex-col gap-3">
			{layout === 'single' ? (
				// 언어 하나를 고르는 설정 전환이다 — 패널 내비게이션이 아니라 같은 판을 다르게 그린다.
				// type="single"이면 Radix가 radiogroup/radio로 렌더해 "하나만 고른다"가 AT에도 전달된다.
				<ToggleGroup
					type="single"
					variant="outline"
					spacing={0}
					value={language}
					// 마지막 항목을 다시 눌러 빈 값이 되면 그릴 문단이 없어진다 — 빈 값은 무시한다.
					onValueChange={(next) => next && setLanguage(next as LanguageKey)}
					aria-label="본문 언어"
				>
					{LANGUAGES.map((option) => (
						<ToggleGroupItem key={option.key} value={option.key} className="px-3">
							{option.label}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
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
