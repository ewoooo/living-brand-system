// CI 락업 조립 규칙. 모든 값은 H(심볼 = Forward Mark 높이) 배수다.
// 출처: `.scratch/hd-reference/01-specs.md` (브랜드팀 PDF 정독분).
//
// 🔴 여기 숫자를 눈대중으로 고치지 말 것. 정본과 어긋나면 브랜드팀과 상의해 스펙을 바꾼다.
// 🔴 완성 락업 SVG를 쓰지 않는 이유: CI → 자회사 → 해외지사는 평평한 3종이 아니라 **계층 누적**이라
//    완성본을 파일로 유지하면 회사·지부가 늘 때마다 배리언트가 곱셈으로 터진다. 전부 같은 H비율
//    그리드에 조각 배치만 다른 결과이므로, 조각(심볼 + 서체) + 규칙으로 조립한다.
//
// 🔴 react·에셋 import 금지(schema가 이 모듈을 참조하게 될 수 있다).

/**
 * HD체 실측값(`fontTools`, HD OTF 3종 공통). unitsPerEm 1000 기준의 비율이다.
 * 🔴 스펙의 "워드마크 0.65H"는 **cap height** 기준임이 확정됐다(2026-08-03 실측) —
 *    `HD`처럼 라틴 대문자만 있는 유형이 정확히 0.6500으로 측정되고, 한글이 섞인 유형의 초과분이
 *    폰트 잉크 비율로 정확히 설명된다. 그래서 font-size는 cap을 나눠서 역산한다.
 */
export const FONT = { cap: 0.68, ascender: 0.8, descender: 0.23 } as const

/** cap 높이를 목표로 할 때의 font-size 배수. `font-size = cap배수 × H ÷ 0.68` */
export function fontSizeFor(cap: number, h: number) {
	return (cap * h) / FONT.cap
}

/**
 * `line-height: 1`인 줄상자에서 cap 상자만 남기고 잘라낼 여백(em).
 * 줄상자(1em) 안에 글자상자(asc+desc)가 가운데 놓이므로 베이스라인 위치가 정해지고,
 * 거기서 cap 위/아래로 남는 만큼을 음수 마진으로 걷어낸다.
 * 🔴 이게 있어야 "간격 0.25H"가 **글자의 눈에 보이는 위아래**를 기준으로 성립한다. 안 걷어내면
 *    폰트의 어센더·디센더 여백까지 간격에 포함돼 정본보다 벌어진다.
 */
const HALF_LEADING = (1 - (FONT.ascender + FONT.descender)) / 2
const BASELINE = FONT.ascender + HALF_LEADING
export const CAP_TRIM = {
	top: -(BASELINE - FONT.cap),
	bottom: -(1 - BASELINE),
} as const

export type Orientation = 'horizontal' | 'vertical'

/** 워드마크 한 줄. cap = 그 줄 글자의 cap 높이(H 배수). */
export type Line = {
	text: string
	cap: number
	/** 이 줄 위의 간격(H 배수). 없으면 락업의 lineGap을 쓴다. 첫 줄에서는 무시된다. */
	gapBefore?: number
	/** 🔴 스펙에 없어 추정한 값. 화면에 표시해 브랜드팀 확인 대상임을 드러낸다. */
	assumed?: boolean
}

export type Lockup = {
	key: string
	label: string
	/** 계층: 본사 → 자회사 → 해외지사로 갈수록 워드마크 줄이 뒤에 쌓인다. */
	tier: 'ci' | 'subsidiary' | 'overseas'
	orientation: Orientation
	/** 심볼–워드마크 간격(H 배수). */
	gap: number
	/** 워드마크 줄 사이 간격(H 배수). */
	lineGap: number
	lines: Line[]
	/**
	 * 스펙이 따로 명시한 **로고타입 총 영역**(H 배수). 조립 결과가 이 값과 맞아야 한다 —
	 * 줄 높이와 간격만으로 쌓은 합이 스펙의 총합과 일치하는지가 규칙이 맞다는 유일한 검산이다.
	 * `rules.test.ts`가 이걸 검사한다. 스펙에 총 영역이 없으면 비운다.
	 */
	area?: number
	/** 스펙 원문 근거. 화면과 코드가 같은 출처를 가리키게 한다. */
	source: string
	/** 추정이 섞였을 때 그 이유. */
	note?: string
}

/**
 * 본사 CI 배치 비율(01-specs A). 언어와 무관하게 같다.
 * 🔴 본사 비율의 정본은 여기 하나다 — 분리형 조립 샘플(separated-logo-application)도 이 값을 읽는다.
 */
export const LAYOUT: Record<Orientation, { wordmark: number; gap: number }> = {
	horizontal: { wordmark: 0.65, gap: 0.25 },
	vertical: { wordmark: 0.3, gap: 0.2 },
}

/** 본사 CI — 워드마크 한 줄. */
const CI: Lockup[] = (
	[
		['ko', '국문형', 'HD현대'],
		['en', '영문형', 'HD HYUNDAI'],
		['hd', 'HD형', 'HD'],
	] as const
).flatMap(([key, label, text]) => [
	{
		key: `ci-${key}-h`,
		label: `본사 ${label} 가로`,
		tier: 'ci' as const,
		orientation: 'horizontal' as const,
		gap: LAYOUT.horizontal.gap,
		lineGap: 0,
		lines: [{ text, cap: LAYOUT.horizontal.wordmark }],
		source: '01-specs A · 가로형 워드마크 0.65H · 간격 0.25H',
	},
	{
		key: `ci-${key}-v`,
		label: `본사 ${label} 세로`,
		tier: 'ci' as const,
		orientation: 'vertical' as const,
		gap: LAYOUT.vertical.gap,
		lineGap: 0,
		lines: [{ text, cap: LAYOUT.vertical.wordmark }],
		source: '01-specs A · 세로형 워드마크 0.3H · 간격 0.2H',
	},
])

/**
 * 자회사 CI — 본사 뒤에 회사명이 붙는다. 예시는 PDF가 쓴 HD현대중공업.
 * 🔴 국문은 본사와 같은 높이 한 줄, 영문은 상하조합이다(01-specs B).
 */
const SUBSIDIARY: Lockup[] = [
	{
		key: 'sub-ko-hA',
		label: '자회사 국문 가로형A',
		tier: 'subsidiary',
		orientation: 'horizontal',
		gap: 0.25,
		lineGap: 0,
		lines: [{ text: 'HD현대중공업', cap: 0.65 }],
		source: '01-specs B p18 · 간격 0.25H · 워드마크 0.65H(국문)',
	},
	{
		key: 'sub-en-hA',
		label: '자회사 영문 가로형A',
		tier: 'subsidiary',
		orientation: 'horizontal',
		gap: 0.25,
		lineGap: 0.2,
		lines: [
			{ text: 'HD', cap: 0.65, assumed: true },
			{ text: 'HYUNDAI', cap: 0.28 },
			{ text: 'HEAVY INDUSTRIES', cap: 0.28 },
		],
		source: '01-specs B p18 · 심볼–HD 0.25H · HD–영문 0.2H · 영문 각 행 0.28H',
		note: 'HD 행의 cap 높이가 스펙에 없어 본사 가로형과 같은 0.65H로 뒀다. 영문 2행 사이 간격도 스펙에 없어 HD–영문 간격을 그대로 썼다.',
	},
	{
		key: 'sub-ko-hB',
		label: '자회사 국문 가로형B',
		tier: 'subsidiary',
		orientation: 'horizontal',
		gap: 0.2,
		// 로고타입 영역 0.9H = 0.4H + 간격 + 0.4H → 간격 0.1H (스펙 수치에서 나온 값)
		lineGap: 0.1,
		lines: [
			{ text: 'HD', cap: 0.4 },
			{ text: '현대중공업', cap: 0.4 },
		],
		area: 0.9,
		source: '01-specs B p23 · 간격 0.2H · 글자영역 0.9H · 상단 0.4H · 하단 0.4H',
	},
	{
		key: 'sub-en-hB',
		label: '자회사 영문 가로형B',
		tier: 'subsidiary',
		orientation: 'horizontal',
		gap: 0.2,
		lineGap: 0.1,
		lines: [
			{ text: 'HD', cap: 0.4 },
			{ text: 'HYUNDAI', cap: 0.17 },
			// 0.9(총 영역) − 0.4 − 0.1 − 0.17 − 0.17 = 0.06. 추정이 아니라 스펙 두 수치에서 나온 값이다.
			{ text: 'HEAVY INDUSTRIES', cap: 0.17, gapBefore: 0.06 },
		],
		area: 0.9,
		source: '01-specs B p23 · 글자영역 0.9H · 영문 HYUNDAI / HEAVY INDUSTRIES 각 행 0.17H',
		note: '영문 2행 사이 간격은 스펙에 없지만 총 영역 0.9H에서 역산된다(HD–영문 간격을 국문과 같은 0.1H로 볼 때).',
	},
	{
		key: 'sub-ko-v',
		label: '자회사 국문 세로형',
		tier: 'subsidiary',
		orientation: 'vertical',
		gap: 0.2,
		// 로고타입 영역 0.7H = 0.3H + 간격 + 0.3H → 간격 0.1H
		lineGap: 0.1,
		lines: [
			{ text: 'HD', cap: 0.3 },
			{ text: '현대중공업', cap: 0.3 },
		],
		area: 0.7,
		source: '01-specs B p25 · 간격 0.2H · 로고타입영역 0.7H · 각 행 0.3H',
	},
	{
		key: 'sub-en-v',
		label: '자회사 영문 세로형',
		tier: 'subsidiary',
		orientation: 'vertical',
		gap: 0.2,
		lineGap: 0.1,
		lines: [
			{ text: 'HD', cap: 0.3 },
			{ text: 'HYUNDAI', cap: 0.125 },
			// 0.7(총 영역) − 0.3 − 0.1 − 0.125 − 0.125 = 0.05.
			{ text: 'HEAVY INDUSTRIES', cap: 0.125, gapBefore: 0.05 },
		],
		area: 0.7,
		source: '01-specs B p25 · 로고타입영역 0.7H · 영문 각 행 0.125H',
		note: '영문 2행 사이 간격은 스펙에 없지만 총 영역 0.7H에서 역산된다(HD–영문 간격을 국문과 같은 0.1H로 볼 때).',
	},
]

/**
 * 해외지사 CI — 자회사 뒤에 지부명이 또 붙는다. 지부명은 영문 고정.
 * 세로형에서 로고타입 영역이 0.7H → 0.9H로 자라고 0.1H 라인이 추가된다.
 */
const OVERSEAS: Lockup[] = [
	{
		key: 'ovs-v',
		label: '해외지사 세로형',
		tier: 'overseas',
		orientation: 'vertical',
		gap: 0.2,
		lineGap: 0.1,
		lines: [
			{ text: 'HD', cap: 0.3 },
			{ text: '현대중공업', cap: 0.3 },
			{ text: 'EUROPE R&D CENTER', cap: 0.1 },
		],
		area: 0.9,
		source: '세로형 로고타입영역 0.7H → 0.9H, 지부명 0.1H 라인 추가(사용자 제공 그리드 예시)',
		note: '자회사 세로형에 0.1H 지부명 한 줄이 얹힌 형태다. 지부명 앞 간격은 스펙에 없어 0.1H로 뒀다.',
	},
]

/** 조립했을 때의 워드마크 총 영역(H 배수). 줄 cap 합 + 줄 사이 간격 합. */
export function composedArea(lockup: Lockup) {
	return lockup.lines.reduce(
		(sum, line, i) => sum + line.cap + (i === 0 ? 0 : (line.gapBefore ?? lockup.lineGap)),
		0,
	)
}

export const LOCKUPS: Lockup[] = [...CI, ...SUBSIDIARY, ...OVERSEAS]

export const TIER_LABEL: Record<Lockup['tier'], string> = {
	ci: 'CI (본사)',
	subsidiary: '자회사 CI',
	overseas: '해외지사 CI',
}

/** 클리어스페이스·최소 크기 — 락업 조립과 별개의 규정이라 여기 값만 둔다. */
export const CLEAR_SPACE: Record<Orientation, { normal: number; exception: number }> = {
	horizontal: { normal: 0.5, exception: 0.25 },
	vertical: { normal: 0.4, exception: 0.2 },
}
export const MIN_SIZE = { digitalPx: 16, printMm: 4 } as const

/**
 * 심볼 파일. default=기본형(색 고정), mono=fill로 색 지정 가능한 분리형.
 * 🔴 심볼은 조립하지 않는다 — 승인된 아트워크를 그대로 쓴다.
 */
export const SYMBOL = {
	default: '/symbols/symbol-default.svg',
	mono: '/symbols/symbol-mono.svg',
	/** viewBox 51.96 × 60 */
	aspect: 51.96 / 60,
} as const

/**
 * 워드마크 색. 🔴 hex를 박지 않는다 — brand-colors가 소유하고 이름으로 찾는다.
 * 정본 락업 파일 사이에 `#002f87` / `#003087` 불일치가 있고, 컬렉션에 등재된 쪽이 후자다.
 */
export const WORDMARK_COLOR_NAME = 'HD DISCOVERY BLUE'

/**
 * 락업을 얹는 판 색. 🔴 취향이 아니라 규정이다 — 기본형(Full Color)은 흰색 혹은 밝은색 배경
 * 전용이고(01-specs C), 어두운 면 위에 얹으면 그 자체가 규정 위반 예시가 된다.
 * 다크 모드에서도 이 판만은 밝아야 한다.
 */
export const STAGE_COLOR_NAME = 'WHITE'

/**
 * 🔴 미해결 — 조립 결과와 정본의 차이.
 * 정본을 겹쳐보면 획이 더 굵고 자간이 좁다(사용자 육안, 2026-08-04). 높이 비율이 폰트 메트릭과
 * 일치하는 것은 "폰트를 베이스로 했다"는 증거일 뿐이다 — cap을 유지한 채 획 두께·자간만 다듬으면
 * 높이 비율은 변하지 않기 때문이다. 원인 후보는 ① 수작업 레터링 ② 공개 배포본과 다른 내부 폰트.
 * ②라면 그 폰트만 확보하면 이 조립 경로가 그대로 산다.
 * 🔴 그래서 자간을 손으로 좁히지 않는다(letter-spacing: normal). 차이를 없애면 판정을 못 한다.
 */
export const FIDELITY_CAVEAT =
	'조립 결과는 정본과 획 두께·자간이 다릅니다. 원인(수작업 레터링 / 내부 전용 폰트)이 확인되기 전까지 검토용입니다.'
