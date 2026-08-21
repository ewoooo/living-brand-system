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
import { SPEC_READOUT } from '../readout'

// 좌: 규정대로 쌓인 문단 / 우: 단마다 스펙과 문구 입력칸을 세워 놓은 패널.
// 세 칸이 늘 열려 있고, 한 칸에 포커스가 가면 좌측의 나머지 단이 죽어 그 단만 도드라진다.
//
// 🔴 사용자가 바꾸는 것은 **글자 내용뿐**이다. 크기·굵기·행간에 손잡이를 달지 않는다 —
//    이 위젯의 질문은 "규정을 어떻게 조절하는가"가 아니라 "이 규정 안에서 문단이 어떻게 구성되는가"다.
//    스펙을 만지게 하는 순간 위계가 사용자 취향의 결과처럼 읽힌다.
//
// ponytail: 굵기 부재 안내를 두지 않았다. TIERS가 쓰는 500·700은 AVAILABLE_WEIGHTS에 둘 다 있어
//    조건이 성립하지 않는다(빠진 것은 Light 300인데 어느 단도 쓰지 않는다). 규정이 300을 쓰는 단을
//    갖게 되면 그때 넣는다.

/** 다른 단을 만지는 동안 나머지 단의 투명도. 지우지 않고 죽이기만 한다 — 위계는 나머지 단이 있어야 보인다. */
const DIMMED = 0.3

/**
 * 이 폭부터 규정 크기가 실물 그대로 나온다. 더 넓어져도 규정값을 넘지 않고, 좁아질 때만 줄어든다.
 * 🔴 규정값 자체는 TIER_SIZE(원본 Artboard 46~48의 60 / 30 / 17)가 소유한다 — 여기서 고치지 말 것.
 * 🔴 지금 판형의 실제 폭(약 740)보다 넉넉히 낮게 잡는다. 딱 맞춰 두면 판의 padding만 바뀌어도
 *    규정값에 못 닿아, 옆 패널이 적어 둔 "Size 60px"이 화면과 어긋난다.
 */
const FULL_SIZE_WIDTH = 640

/**
 * 규정 크기를 넘지 않으면서 좁은 판에서만 줄어드는 크기.
 * 🔴 상한이 규정값이다 — 넓은 화면에서 규정보다 커지면 옆 패널이 적어 둔 "Size 60px"이 거짓말이 된다.
 *    반대로 하한이 없으면 좁은 칸에서 Head가 판을 깨뜨린다(px 고정이던 시절의 문제).
 */
function tierFontSize(key: TierKey) {
	const spec = TIER_SIZE[key]
	const floor = Math.max(Math.round(spec * 0.45), 12)
	return `clamp(${floor}px, ${((spec / FULL_SIZE_WIDTH) * 100).toFixed(2)}cqi, ${spec}px)`
}

export function TypeHierarchyView({ language }: { language: LanguageKey }) {
	// 언어가 정해 주는 것: 예시 문구와 행간 규정. 초기값은 공유 상수를 그대로 쓰고,
	// 편집은 새 객체를 만들므로 상수는 변형되지 않는다.
	const [texts, setTexts] = useState<Record<TierKey, string>>(SAMPLE_PARAGRAPH[language])
	// 🔴 선택 상태가 아니라 **지금 만지고 있는 단**이다. 세 단이 늘 함께 편집되므로 아무것도 안 만지는
	//    동안에는 셋 다 살아 있어야 한다 — 그게 이 위젯이 보여 주려는 완성된 문단이다.
	const [editing, setEditing] = useState<TierKey | null>(null)

	const leading = LEADING[language]

	return (
		<div className={`grid w-full md:grid-cols-3 ${HAIRLINE_GRID}`}>
			{/* 좌 — 실제 렌더. 세 단이 한 문단으로 붙어 있어야 크기·행간 차이가 위계로 읽힌다. */}
			<div
				className={`flex flex-col gap-5 p-6 md:col-span-2 ${HAIRLINE_CELL}`}
				// 글자 크기를 그리드 셀이 아니라 이 판 기준으로 잰다(tierFontSize 주석 참고).
				style={{ containerType: 'inline-size' }}
			>
				{TIERS.map((tier) => (
					<p
						key={tier.key}
						// 🔴 줄바꿈 보존 필수 — 예시 문구의 개행이 규정된 조판의 일부다.
						// break-keep: 한글 단어 중간에서 끊기지 않게.
						className="break-keep transition-opacity"
						style={{
							fontFamily: BRAND_FONT_STACK,
							fontWeight: tier.weight,
							fontSize: tierFontSize(tier.key),
							// 규정은 범위다. 렌더는 하한을 쓰고, 범위 전체는 패널이 보여 준다.
							lineHeight: `${leading[tier.key][0]}%`,
							whiteSpace: 'pre-wrap',
							opacity: editing && editing !== tier.key ? DIMMED : 1,
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
						const [min, max] = leading[tier.key]
						const on = editing === tier.key
						return (
							<li
								key={tier.key}
								className={`flex flex-col border ${on ? 'border-foreground' : 'border-border'}`}
							>
								{/*
									🔴 버튼이 아니라 라벨이다. 세 칸이 늘 열려 있어 고를 것이 없고,
									투명도만 바꾸는 가짜 버튼은 키보드에 잡히기만 하고 하는 일이 없다.
								*/}
								<div className="flex flex-col gap-1 p-3 font-body">
									<span className="text-foreground text-sm">{tier.label}</span>
									{/*
										🔴 적용값을 함께 적는다. 규정은 범위인데 좌측 렌더는 하한 하나를
										쓰므로, 범위만 적어 두면 화면의 행간이 어느 값인지 알 수 없다
										(같은 페이지의 언어별 조판 위젯이 쓰는 표기와 맞췄다).
										min은 좌측 lineHeight와 같은 식에서 오므로 둘이 갈라지지 않는다.
									*/}
									<span className={`${SPEC_READOUT} text-xs`}>
										Weight {tier.weight} · Size {TIER_SIZE[tier.key]}px ·
										Leading {min}–{max}% · {min}% 적용
									</span>
								</div>

								{/*
									🔴 contentEditable이 아니라 textarea다. 값이 state 한 곳에만 있어야
									좌측 렌더와 어긋나지 않고, 개행도 그대로 들어온다.
									🔴 세 칸이 동시에 열려 있다 — 이 위젯의 질문이 "문단이 어떻게 구성되는가"라
									한 단씩만 만질 수 있으면 세 단의 관계를 만들어 볼 수가 없다.
								*/}
								<textarea
									value={texts[tier.key]}
									onChange={(event) =>
										setTexts((prev) => ({
											...prev,
											[tier.key]: event.target.value,
										}))
									}
									onFocus={() => setEditing(tier.key)}
									onBlur={() => setEditing(null)}
									rows={3}
									aria-label={`${tier.label} 문구`}
									// 🔴 outline-none을 같이 주면 안 된다 — Tailwind v4의 outline-2는
									// `outline-style: var(--tw-outline-style)`인데 outline-none이 그 변수를
									// none으로 박아 포커스 링이 아예 안 그려진다(키보드로 이 칸을 못 찾는다).
									className="w-full resize-y border-border border-t bg-background p-3 font-body text-foreground text-sm focus-visible:outline-2"
								/>
							</li>
						)
					})}
				</ul>
			</div>
		</div>
	)
}
