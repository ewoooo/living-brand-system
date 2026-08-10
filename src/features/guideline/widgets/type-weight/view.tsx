'use client'

import { useState } from 'react'
import { AVAILABLE_WEIGHTS, BRAND_FONT_STACK, WEIGHTS, type WeightKey } from '../brand-typeface'

// 문구·크기·행간을 묶어 두고 굵기만 갈아 끼운다. 화면에서 달라지는 게 하나뿐이라 그 하나가 보인다.
//
// 🔴 3단에만 선다. HD체는 가변 폰트가 아니라 Light/Medium/Bold 세 파일이라 중간값이 존재하지 않는다 —
//    연속 슬라이더는 브라우저가 합성한 자형을 원본인 척 보여주는 거짓말이 된다.
//    가변 폰트(wght 축)가 들어오면 STOPS 대신 축의 min/max를 쓰고 step만 잘게 낮추면 연속이 된다.

/** 슬라이더와 눈금 라벨이 같은 폭이어야 눈금이 단에 붙어 보인다. */
const CONTROL_WIDTH = 'w-52'
/**
 * 표본 크기. 판 폭에 비례해 어느 셀에 놓여도 같은 그림이 나온다.
 * 🔴 `%`가 아니라 `cqi`인 이유: `%` 글꼴 크기는 부모 글꼴 기준이고, 판이 그리드 셀 안에 있으면
 *    폭 기준도 판이 아니라 셀이 된다. 판을 컨테이너로 선언해 판 기준으로 잰다.
 *    높이는 내용이 정하므로 `cqmax`가 아니라 인라인 축(`cqi`)만 쓴다.
 * 큰 글자 : 작은 글자 = 원본 Artboard 43의 36 : 20을 그대로 옮긴 비다.
 */
const TITLE_SIZE = 'clamp(1.25rem, 3.2cqi, 3rem)'
const BODY_SIZE = 'clamp(0.75rem, 1.78cqi, 1.5rem)'

export function TypeWeightView({
	title,
	body,
	titleLeading,
	bodyLeading,
	initialWeight,
}: {
	title: string
	body: string
	titleLeading: number
	bodyLeading: number
	initialWeight: WeightKey
}) {
	const [index, setIndex] = useState(() =>
		Math.max(
			0,
			WEIGHTS.findIndex((candidate) => candidate.key === initialWeight),
		),
	)
	const weight = WEIGHTS[index] ?? WEIGHTS[0]

	// 파일에 없는 굵기는 브라우저가 합성한다. 그 사실을 안 알리면 합성 자형을 규정 서체로 오해한다.
	const synthesized = !AVAILABLE_WEIGHTS.includes(weight.value)

	return (
		// 컨트롤도 판 안에 둔다 — 굵기를 바꾸는 손잡이와 그 결과가 한 테두리 안에 있어야 한 화면으로 읽힌다.
		<div
			className="flex w-full flex-col gap-8 border border-border px-8 py-10"
			// 표본 크기가 셀이 아니라 이 판을 기준으로 잡히게 한다(TITLE_SIZE 주석 참고).
			style={{ containerType: 'inline-size' }}
		>
			<div className="flex flex-col gap-6">
				{/* 문구의 줄바꿈은 규정 표본 그대로다 — 폭에 따라 흘려보내면 원본과 행 수가 달라진다. */}
				<p
					className="whitespace-pre-line break-keep text-foreground"
					style={{
						fontFamily: BRAND_FONT_STACK,
						fontWeight: weight.value,
						fontSize: TITLE_SIZE,
						lineHeight: titleLeading,
					}}
				>
					{title}
				</p>
				{/* 굵기의 인상은 작은 글자에서 갈린다 — 같은 굵기를 본문 크기로 한 번 더 보여 준다. */}
				<p
					className="whitespace-pre-line break-keep text-foreground"
					style={{
						fontFamily: BRAND_FONT_STACK,
						fontWeight: weight.value,
						fontSize: BODY_SIZE,
						lineHeight: bodyLeading,
					}}
				>
					{body}
				</p>
			</div>

			<div className="flex flex-col gap-3">
				{/* 컨트롤은 유한 폭을 지킨다 — 판의 폭은 프레임 소관이고 컨트롤이 늘어날 이유가 없다. */}
				<div className="flex w-fit items-end gap-4">
					<div className="flex flex-col gap-1">
						<input
							type="range"
							min={0}
							max={WEIGHTS.length - 1}
							step={1}
							value={index}
							onChange={(event) => setIndex(Number(event.target.value))}
							aria-label="서체 굵기"
							// 순번(0·1·2)이 아니라 굵기 이름이 읽히게 한다.
							aria-valuetext={`${weight.label} ${weight.value}`}
							className={`${CONTROL_WIDTH} cursor-pointer accent-foreground`}
						/>
						{/* 슬라이더가 aria-valuetext로 이미 말하므로 눈금은 시각 전용이다. */}
						<div className={`flex ${CONTROL_WIDTH} justify-between`} aria-hidden="true">
							{WEIGHTS.map((candidate, i) => (
								<span
									key={candidate.key}
									className={
										i === index
											? 'font-body text-foreground text-xs'
											: 'font-body text-muted-foreground text-xs'
									}
								>
									{candidate.label}
								</span>
							))}
						</div>
					</div>

					<span className="font-body text-foreground text-sm tabular-nums">
						{weight.label} {weight.value}
					</span>
				</div>

				{/*
					안내와 경고가 같은 자리를 쓴다 — 굵기를 바꿀 때마다 줄이 생겼다 사라지면 판이 들썩인다.
					role="status"라 합성 경고가 스크린리더에도 전달된다.
				*/}
				<p
					role="status"
					className={
						synthesized
							? 'font-body text-destructive text-xs'
							: 'font-body text-muted-foreground text-xs'
					}
				>
					{synthesized
						? `${weight.label}(${weight.value})는 아직 서체 파일에 없어 브라우저가 대신 그린 굵기입니다. 원본 자형과 다릅니다.`
						: '슬라이더를 움직여 굵기 3종을 비교해 보세요. 굵기는 세 단에만 멈춥니다.'}
				</p>
			</div>
		</div>
	)
}

export default TypeWeightView
