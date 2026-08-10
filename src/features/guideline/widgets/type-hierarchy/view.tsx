'use client'

import { useState } from 'react'
import {
	BRAND_FONT_STACK,
	type LanguageKey,
	LEADING,
	SAMPLE_PARAGRAPH,
	TIER_SIZE,
	TIERS,
	type TierKey,
} from '../brand-typeface'
import { HAIRLINE_CELL, HAIRLINE_GRID } from '../hairline'

// 좌: 규정대로 쌓인 문단 / 우: 각 단의 스펙을 세워 놓은 레이어 패널.
// 패널에서 한 단을 고르면 좌측의 그 단이 살아나고 문구를 바꿀 수 있다.
//
// 🔴 사용자가 바꾸는 것은 **글자 내용뿐**이다. 크기·굵기·행간에 손잡이를 달지 않는다 —
//    이 위젯의 질문은 "규정을 어떻게 조절하는가"가 아니라 "이 규정 안에서 문단이 어떻게 구성되는가"다.
//    스펙을 만지게 하는 순간 위계가 사용자 취향의 결과처럼 읽힌다.
//
// ponytail: 굵기 부재 안내를 두지 않았다. TIERS가 쓰는 500·700은 AVAILABLE_WEIGHTS에 둘 다 있어
//    조건이 성립하지 않는다(빠진 것은 Light 300인데 어느 단도 쓰지 않는다). 규정이 300을 쓰는 단을
//    갖게 되면 그때 넣는다.

/** 선택되지 않은 단의 투명도. 지우지 않고 죽이기만 한다 — 위계는 나머지 단이 있어야 보인다. */
const DIMMED = 0.3

export function TypeHierarchyView({ language }: { language: LanguageKey }) {
	// 언어가 정해 주는 것: 예시 문구와 행간 규정. 초기값은 공유 상수를 그대로 쓰고,
	// 편집은 새 객체를 만들므로 상수는 변형되지 않는다.
	const [texts, setTexts] = useState<Record<TierKey, string>>(SAMPLE_PARAGRAPH[language])
	// 처음부터 하나가 선택돼 있어야 편집 칸이 보이고, 좌측의 강조가 무엇을 뜻하는지 읽힌다.
	const [selected, setSelected] = useState<TierKey>('head')

	const leading = LEADING[language]

	return (
		<div className={`grid w-full md:grid-cols-3 ${HAIRLINE_GRID}`}>
			{/* 좌 — 실제 렌더. 세 단이 한 문단으로 붙어 있어야 크기·행간 차이가 위계로 읽힌다. */}
			<div className={`flex flex-col gap-5 p-6 md:col-span-2 ${HAIRLINE_CELL}`}>
				{TIERS.map((tier) => (
					<p
						key={tier.key}
						// 🔴 줄바꿈 보존 필수 — 예시 문구의 개행이 규정된 조판의 일부다.
						// break-keep: 한글 단어 중간에서 끊기지 않게.
						className="break-keep transition-opacity"
						style={{
							fontFamily: BRAND_FONT_STACK,
							fontWeight: tier.weight,
							fontSize: `${TIER_SIZE[tier.key]}px`,
							// 규정은 범위다. 렌더는 하한을 쓰고, 범위 전체는 패널이 보여 준다.
							lineHeight: `${leading[tier.key][0]}%`,
							whiteSpace: 'pre-wrap',
							opacity: tier.key === selected ? 1 : DIMMED,
						}}
					>
						{texts[tier.key]}
					</p>
				))}
			</div>

			{/* 우 — 레이어 패널. 항목이 곧 그 단의 스펙 카드다. */}
			<div className={`flex flex-col gap-3 p-4 ${HAIRLINE_CELL}`}>
				<ul className="flex flex-col gap-2">
					{TIERS.map((tier) => {
						const on = tier.key === selected
						const [min, max] = leading[tier.key]
						return (
							<li
								key={tier.key}
								className={`flex flex-col border ${on ? 'border-foreground' : 'border-border'}`}
							>
								{/* 선택을 색만으로 구분하지 않는다 — 굵기가 같이 바뀌고 편집 칸이 열린다. */}
								<button
									type="button"
									aria-pressed={on}
									onClick={() => setSelected(tier.key)}
									className={`flex flex-col gap-1 p-3 text-left font-body focus-visible:outline-2 ${
										on
											? 'bg-muted font-semibold text-foreground'
											: 'font-normal text-muted-foreground hover:bg-muted'
									}`}
								>
									<span className="text-sm">{tier.label}</span>
									<span className="font-mono font-normal text-xs tabular-nums">
										Weight {tier.weight} · Size {TIER_SIZE[tier.key]}px ·
										Leading {min}~{max}%
									</span>
								</button>

								{/*
									🔴 contentEditable이 아니라 textarea다. 값이 state 한 곳에만 있어야
									좌측 렌더와 어긋나지 않고, 개행도 그대로 들어온다.
								*/}
								{on ? (
									<textarea
										value={texts[tier.key]}
										onChange={(event) =>
											setTexts((prev) => ({
												...prev,
												[tier.key]: event.target.value,
											}))
										}
										rows={3}
										aria-label={`${tier.label} 문구`}
										// 🔴 outline-none을 같이 주면 안 된다 — Tailwind v4의 outline-2는
										// `outline-style: var(--tw-outline-style)`인데 outline-none이 그 변수를
										// none으로 박아 포커스 링이 아예 안 그려진다(키보드로 이 칸을 못 찾는다).
										className="w-full resize-y border-border border-t bg-background p-3 font-body text-foreground text-sm focus-visible:outline-2"
									/>
								) : null}
							</li>
						)
					})}
				</ul>

				<p className="font-body text-muted-foreground text-xs">
					단을 골라 문구를 바꿔 보세요. 크기·굵기·행간은 규정이라 고정입니다.
				</p>
			</div>
		</div>
	)
}
