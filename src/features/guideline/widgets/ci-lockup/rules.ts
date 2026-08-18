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
 * 워드마크 조판. 🔴 **임시 서체다** — 이사만루(사용자 지정, weight 400). 정본 서체가 아니다.
 * 락업 하나 안의 텍스트는 **라틴이든 한글이든 전부 이 서체 하나**를 쓴다(사용자 결정 2026-08-14).
 * 🔴 라틴만 있는 서체로 일부를 덮지 말 것 — 반쪽짜리는 안 쓰는 게 낫다는 것이 그 결정의 이유다.
 *
 * 서체는 하나인데 값이 둘인 이유: **워드마크에 나오는 것은 라틴 대문자와 조합형 한글 두 경우뿐**이고
 * 서체가 그 둘을 다른 크기로 그린다. `ink`는 글자가 실제로 그려지는 상자를 베이스라인 기준 em으로
 * 적은 것이고, 경우마다 그 상자를 `cap × H`로 맞추는 것이 조판의 전부다.
 * 🔴 **정본은 라틴 대문자와 한글의 위아래 끝이 정확히 같다** — `scripts/assets/ci/ko-horizontal-default.svg`를
 *    재면 H·D·대가 전부 top 15.75 / bottom 74.25(= 0.65H)로 나온다. 서체는 그렇지 않으므로 렌더가 맞춘다.
 * 🔴 서체를 갈면 아래 수치를 전부 다시 재야 한다 — `python3 .scratch/scripts/measure-cap-vs-hangul.py <폰트>`
 *    (어센더·디센더도 서체마다 다르다). 한글 `ink`는 받침·오버슛 때문에 글자마다 달라서, 정본에서
 *    유일하게 검증 가능한 `대`를 기준으로 잡는다 — 정본도 `대`가 라틴과 같은 상자를 채우고 `현`이
 *    위로 오버슛하며, 이 서체도 같은 방향으로 벗어난다.
 */
export const FONT = {
	family: '"Isamanru", var(--font-body)',
	weight: 400,
	ascender: 0.85,
	descender: 0.315,
	ink: {
		latin: { top: 0.715, bottom: -0.073 },
		hangul: { top: 0.748, bottom: -0.134 },
	},
} as const

export type Script = 'latin' | 'hangul'

/** 잉크 높이를 `cap × H`로 만드는 font-size. 경우마다 잉크 비율이 달라 나누는 값이 다르다. */
export function fontSizeFor(cap: number, h: number, script: Script) {
	const { top, bottom } = FONT.ink[script]
	return (cap * h) / (top - bottom)
}

/**
 * `line-height: 1`인 줄상자에서 잉크 상자만 남기고 잘라낼 여백(em).
 * 줄상자(1em) 안에 글자상자(asc+desc)가 가운데 놓이므로 베이스라인 위치가 정해지고,
 * 거기서 잉크 위/아래로 남는 만큼을 음수 마진으로 걷어낸다.
 * 🔴 이게 있어야 "간격 0.25H"가 **글자의 눈에 보이는 위아래**를 기준으로 성립한다. 안 걷어내면
 *    폰트의 어센더·디센더 여백까지 간격에 포함돼 정본보다 벌어진다.
 * 🔑 경우별 잉크 상자를 각각 걷어내는 것이 곧 높이·위치를 맞추는 방법이다 — 남는 상자가
 *    양쪽 다 `cap × H`가 되므로 한 줄에 나란히 놓으면 위아래 끝이 정본처럼 일치한다.
 */
const BASELINE = FONT.ascender + (1 - (FONT.ascender + FONT.descender)) / 2
export function trimFor(script: Script) {
	const { top, bottom } = FONT.ink[script]
	return { top: -(BASELINE - top), bottom: -(1 - BASELINE + bottom) }
}

/**
 * 글자별 좌우 사이드베어링(em) — **위아래 트림의 좌우판이다.** 폰트는 글자 좌우에 여백을 두는데
 * 정본 레터링에는 그런 여백이 없다.
 * 🔴 정본은 심볼–워드마크 간격 0.25H를 **잉크 기준**으로 잰다 — `ko-horizontal-default.svg`에서
 *    심볼 우단 77.93 → `H` 잉크 좌단 100.43 = 22.5 = 정확히 0.25×90H. 글자상자 기준으로 두면
 *    `H`의 LSB 0.065em이 그대로 더해져 규정 간격이 21% 틀어진다(H=100에서 25px → 30.4px).
 * 줄의 **첫 글자 left**와 **마지막 글자 right**만 쓰이므로 그 글자들만 담는다.
 * 🔴 표에 없는 글자는 fallback으로 떨어진다(오차 최대 0.05em). 계열사 이름을 자유입력으로 받으면
 *    대부분 그렇게 되지만, **규정 간격이 걸린 자리는 항상 `HD`로 시작**하므로 그것만은 정확하다.
 *    정확히 맞추려면 브라우저에서 글자마다 실측해야 하고 그건 클라이언트 계산이 필요하다.
 */
const BEARING: Record<string, { left: number; right: number }> = {
	D: { left: 0.065, right: 0.057 },
	E: { left: 0.059, right: 0.049 },
	H: { left: 0.065, right: 0.065 },
	I: { left: 0.065, right: 0.065 },
	R: { left: 0.065, right: 0.008 },
	S: { left: 0.047, right: 0.057 },
	대: { left: 0.063, right: 0.045 },
	업: { left: 0.047, right: 0.087 },
	현: { left: 0.042, right: 0.066 },
}
const BEARING_FALLBACK: Record<Script, { left: number; right: number }> = {
	latin: { left: 0.06, right: 0.06 },
	hangul: { left: 0.04, right: 0.04 },
}
export function bearingOf(char: string | undefined, script: Script) {
	return (char && BEARING[char]) || BEARING_FALLBACK[script]
}

/** 한 줄을 스크립트가 바뀌는 자리에서 끊는다. `HD현대` → `HD`(라틴) + `현대`(한글). */
const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힣]/
export function splitScripts(text: string) {
	const runs: { script: Script; text: string }[] = []
	for (const char of text) {
		const script: Script = HANGUL.test(char) ? 'hangul' : 'latin'
		const last = runs.at(-1)
		if (last?.script === script) last.text += char
		else runs.push({ script, text: char })
	}
	return runs
}

export type Orientation = 'horizontal' | 'vertical'

/**
 * 워드마크 한 행.
 * 🔴 `cap`은 **명목 cap 상자**(베이스라인↔cap 라인) 높이다 — 잉크 bbox가 아니다. 정본 도판 6개에서
 *    치수 라벨은 예외 없이 하이라이트 밴드(= 명목 상자)에 붙고, 잉크는 둥근 글자에서 그것을 벗어난다
 *    (한글 `ㅎ`·`ㅇ`, 라틴 `U`·`S`). p28 국문은 잉크로 재면 0.7155H인데 라벨은 0.65H다.
 *    그래서 렌더는 잉크를 상자에 맞추지 않고 **평평한 기준 글자의 상자**를 맞춘다(FONT.ink 주석).
 */
export type Row = {
	text: string
	cap: number
	/** 이 행 위의 간격(H 배수). 없으면 락업의 rowGap을 쓴다. 첫 행에서는 무시된다. */
	gapBefore?: number
	/** 🔴 스펙에 없어 추정한 값. 화면에 표시해 브랜드팀 확인 대상임을 드러낸다. */
	assumed?: boolean
}

/**
 * 워드마크 한 열. 🔑 **열이 있어야 가로형A를 표현할 수 있다** — 그 꼴에서 `HD`는 위가 아니라
 * 왼쪽에 서고 계열사명 2행이 오른쪽 열에 쌓인다(정본 실측: 0.65H 밴드 우단이 `D` 우단과 일치).
 * 계층 누적이 "행이 뒤에 쌓인다"가 아니라 **꼴마다 다른 축으로 자란다**는 것이 이 타입의 이유다.
 */
export type Column = {
	rows: Row[]
	/** 앞 열과의 간격(H 배수). 첫 열에서는 무시된다. */
	gapBefore?: number
	/** 행이 열 아래쪽에 붙는다. 2행 그리드에 1행만 들어갈 때 쓴다(해외지사 지역명 1개). */
	align?: 'bottom'
	/** 글자가 아니라 세로 구분바인 열. 값은 폭(H 배수)이고 높이는 열 영역 전체다. */
	bar?: number
}

export type Lockup = {
	key: string
	label: string
	/** 계층: 본사 → 자회사 → 해외지사. */
	tier: Tier
	orientation: Orientation
	/** 심볼–워드마크 간격(H 배수). */
	gap: number
	/** 열 안 행 사이 기본 간격(H 배수). */
	rowGap: number
	columns: Column[]
	/**
	 * 스펙이 명시한 **로고타입 영역 높이**(H 배수). 🔑 열이 여럿이면 **모든 열이 이 높이를 공유**하고
	 * 열마다 따로 닫혀야 한다 — 그것이 규칙이 맞다는 검산이다(`rules.test.ts`).
	 * 🔴 라벨이 없거나, 라벨이 총합이 아니라 부분 블록을 가리키면 비운다(해외지사 가로형B).
	 */
	area?: number
	/**
	 * 라벨이 **앞 몇 행만** 가리킬 때의 부분 검산. 해외지사 가로형B가 그렇다 —
	 * 0.9H가 앞 3행(자회사에서 물려받은 로고타입 영역)만이고 지역명은 그 밖에 매달린다.
	 */
	partialArea?: { rows: number; value: number }
	/**
	 * 심볼이 **앞 몇 행에** 수직 중앙정렬되는지. 비우면 열 전체에 맞춘다.
	 *
	 * 🔑 해외지사 가로형B가 이것을 필요로 한다. 그 꼴은 자회사 락업을 **건드리지 않고** 지역명을
	 * 오른쪽 열의 아래 행에 매다는 **2×2 그리드**다(사용자 지정) — 즉 심볼은 자회사 블록과 짝을
	 * 이루고 지역명은 그 짝 밖으로 흘러내린다. 정본 실측이 그것이다: 심볼 470–610의 중심 540이
	 * 앞 3행 블록 477–603의 중심과 같고, 지역명을 포함한 전체(477–633.8)의 중심 555.4가 아니다.
	 * 🔴 전체에 맞추면 심볼이 0.11H 내려앉는다.
	 */
	baseRows?: number
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

/** 계층. 슬라이더가 고르는 단계이고, 뒤로 갈수록 워드마크 줄이 쌓인다. */
export const TIERS = ['ci', 'subsidiary', 'overseas'] as const
export type Tier = (typeof TIERS)[number]

/**
 * 자회사 — `HD` 뒤에 붙는 것만 담는다. 대문자화는 렌더가 한다(데이터는 기업명 원형을 지킨다).
 * `en`이 두 줄이면 워드마크가 2행으로 쌓인다.
 * 🔴 **첫 줄이 항상 `Hyundai`인 것은 아니다** — 영문에 Hyundai가 없는 회사가 있어서 줄 배분을 데이터가
 *    직접 명시한다. 로직으로 나누면 그 회사에서 틀린다.
 */
export type Subsidiary = { ko: string; en: readonly [string] | readonly [string, string] }

/**
 * 🔴 **기억으로 고치지 말 것.** 18개 전부 각 회사 공식 사이트·HD현대 그룹 영문 페이지에서 확인한 값이고
 *    (2026-08-14, 회사마다 조회 + 독립 반증 2회), 추측이 실제로 빗나가는 자리가 넷 있다:
 *    - `사이트솔루션` = `XiteSolution` — `Site`가 아니고 한 단어다
 *    - `쉘베이스오일` = `Hyundai and Shell Base Oil` — 국문에 없는 `and`가 영문에 들어간다
 *    - `하이드로젠`·`한국조선해양`·`건설기계` = **국문에도 `현대`가 없다**(`HD하이드로젠`). 그래서 `ko`에 `현대`를 담는다
 *    - `이엔티` = 표기 3종이 공존한다(아래 주석)
 */
export const SUBSIDIARIES: readonly Subsidiary[] = [
	{ ko: '현대중공업', en: ['Hyundai', 'Heavy Industries'] },
	{ ko: '현대삼호', en: ['Hyundai', 'Samho'] },
	{ ko: '현대마린솔루션', en: ['Hyundai', 'Marine Solution'] },
	{ ko: '현대마린엔진', en: ['Hyundai', 'Marine Engine'] },
	// 🔴 미확정 — 그룹 영문 페이지는 `HD Hyundai E&T`, 회사 자기 영문 사이트 개요표는 `HD Hyundai ENT`,
	//    로고·copyright는 `HD HYUNDAI ENGINEERING&TECHNOLOGY`다. 사내 CI 기준 표기를 브랜드팀에 확인할 것.
	{ ko: '현대이엔티', en: ['Hyundai', 'E&T'] },
	{ ko: '현대오일뱅크', en: ['Hyundai', 'Oilbank'] },
	{ ko: '현대케미칼', en: ['Hyundai', 'Chemical'] },
	// 🔴 줄 배분 미확정 — 영문 정식명은 `HD Hyundai and Shell Base Oil`이 맞지만, 2행으로 쪼갤 때
	//    `and`가 어느 줄에 붙는지는 정본 락업이 없어 확인 불가. 지금은 "첫 줄은 Hyundai 단독" 규칙을 따랐다.
	{ ko: '현대쉘베이스오일', en: ['Hyundai', 'and Shell Base Oil'] },
	{ ko: '현대오씨아이', en: ['Hyundai', 'OCI'] },
	{ ko: '현대이앤에프', en: ['Hyundai', 'E&F'] },
	{ ko: '현대일렉트릭', en: ['Hyundai', 'Electric'] },
	{ ko: '현대에너지솔루션', en: ['Hyundai', 'Energy Solutions'] },
	{ ko: '현대사이트솔루션', en: ['Hyundai', 'XiteSolution'] },
	{ ko: '현대로보틱스', en: ['Hyundai', 'Robotics'] },
	{ ko: '현대스포츠', en: ['Hyundai', 'Sports'] },
	{ ko: '하이드로젠', en: ['Hydrogen'] },
	{ ko: '건설기계', en: ['Construction', 'Equipment'] },
	{ ko: '한국조선해양', en: ['Korea Shipbuilding &', 'Offshore Engineering'] },
]

/**
 * 해외지사 — 영문 한 줄 고정. **모든 자회사가 같은 목록을 공유한다**(사용자 결정 2026-08-14).
 * 🔴 `EUROPE R&D CENTER`만 스펙 도판에 실제로 나온 값이고 **나머지는 지어낸 자리표시자다**
 *    (사용자 요청). 실제 지부 목록을 받으면 이 배열만 통째로 갈아치운다.
 */
export type OverseasBranch = { region: string; business?: string }

export const OVERSEAS_BRANCHES: readonly OverseasBranch[] = [
	// 🔴 도판에 실제로 나온 것은 이 하나뿐이다(p35 상단은 지역명만, 하단은 지역명+사업명 2행).
	{ region: 'EUROPE', business: 'R&D CENTER' },
	{ region: 'AMERICA' },
	{ region: 'EUROPE' },
	{ region: 'CHINA' },
	{ region: 'JAPAN' },
	{ region: 'SINGAPORE' },
	{ region: 'VIETNAM', business: 'PLANT' },
	{ region: 'INDIA' },
	{ region: 'BRAZIL' },
	{ region: 'MIDDLE EAST', business: 'OFFICE' },
]

/** 가로형B·세로형은 지부명을 한 줄로 쓴다(도판 `EUROPE R&D CENTER`). */
export function branchLabel(branch: OverseasBranch) {
	return branch.business ? `${branch.region} ${branch.business}` : branch.region
}

/** 데이터는 기업명 원형을 지키고 대문자화는 여기서 한다. */
const caps = (t: string) => t.toUpperCase()

/** 본사 CI — 워드마크 한 줄, 한 열. */
function ciLockups(): Lockup[] {
	return (
		[
			['ko', '국문형', 'HD현대'],
			['en', '영문형', 'HD HYUNDAI'],
			['hd', 'HD형', 'HD'],
		] as const
	).flatMap(([key, label, text]) =>
		(['horizontal', 'vertical'] as const).map((orientation) => ({
			key: `ci-${key}-${orientation[0]}`,
			label: `본사 ${label} ${orientation === 'horizontal' ? '가로' : '세로'}`,
			tier: 'ci' as const,
			orientation,
			gap: LAYOUT[orientation].gap,
			rowGap: 0,
			columns: [{ rows: [{ text, cap: LAYOUT[orientation].wordmark }] }],
			source: `01-specs A · ${orientation === 'horizontal' ? '가로형 워드마크 0.65H · 간격 0.25H' : '세로형 워드마크 0.3H · 간격 0.2H'}`,
		})),
	)
}

/**
 * 꼴 3종의 배치 비율. 🔴 스펙이 도판으로 정한 세트이지 고르는 축이 아니다 — 그래서 컨트롤이 없고
 * 단계를 고르면 세 꼴이 함께 나온다.
 *
 * `hdCap`/`enCap`은 각 행의 명목 cap 상자 높이(H 배수)다. **가로형A만 열이 갈린다** —
 * `HD`가 왼쪽 열에 서고 계열사명 2행이 오른쪽 열에 쌓이며, 두 열이 같은 영역 높이(0.65H)를 공유한다.
 */
const FORMS = {
	horizontalA: {
		label: '가로형A',
		orientation: 'horizontal' as const,
		gap: 0.25,
		/** 열 사이 간격. 가로형A는 이것이 `HD`와 계열사명 열 사이다. */
		columnGap: 0.2,
		koSingleCap: 0.65,
		hdCap: 0.65,
		enCap: 0.28,
		/** 영문 2행 사이 간격 — [역산: 0.65 − 0.28 − 0.28] + [실측 8.13pt = 0.0902H] */
		enRow2Gap: 0.09,
		area: 0.65,
		source: 'B.2 p28 · 심볼 간격 0.25H · HD 0.65H · 열 간격 0.2H · 영문 각 행 0.28H · 행간 0.09H',
	},
	horizontalB: {
		label: '가로형B',
		orientation: 'horizontal' as const,
		gap: 0.2,
		columnGap: 0,
		koSingleCap: undefined,
		hdCap: 0.4,
		enCap: 0.17,
		/** [역산: 0.4(하단 2행 묶음 라벨) − 0.17 − 0.17] + [실측 5.40pt = 0.0600H] */
		enRow2Gap: 0.06,
		area: 0.9,
		source: 'B.2 p30 · 심볼 간격 0.2H · 글자영역 0.9H · HD 0.4H · 영문 각 행 0.17H · 행간 0.06H',
	},
	vertical: {
		label: '세로형',
		orientation: 'vertical' as const,
		gap: 0.2,
		columnGap: 0,
		koSingleCap: undefined,
		hdCap: 0.3,
		enCap: 0.125,
		/** [역산: 0.3(2·3행 묶음 라벨) − 0.125 − 0.125] + [실측 5.50pt = 0.0500H] */
		enRow2Gap: 0.05,
		area: 0.7,
		source: 'B.2 p32 · 심볼 간격 0.2H · 로고타입영역 0.7H · HD 0.3H · 영문 각 행 0.125H · 행간 0.05H',
	},
} as const

export type FormKey = keyof typeof FORMS
export const FORM_KEYS = ['horizontalA', 'horizontalB', 'vertical'] as const

/** 영문 1행 회사의 조판 근거. 화면에 노출해 스펙 판정이 아니라는 것을 드러낸다. */
const ONE_LINE_EN_NOTE =
	'영문이 한 줄인 회사라 국문과 같은 구조로 조판했다(회사명 높이 = HD 높이). 정본에 1행 영문 예시가 없어 영역 검산이 닫히는 것만이 근거다.'

/** `HD` 다음 행들 사이의 기본 간격(H 배수). 세 꼴 모두 0.1H로 실측된다. */
const HD_ROW_GAP = 0.1

/**
 * 계열사명 행들. 영문이 두 줄이면 두 번째 행에 꼴별 행간이 붙는다.
 *
 * 🔑 **영문이 한 줄인 회사(`HD Hydrogen`)는 국문과 같은 구조로 조판한다**(사용자 지정 2026-08-14) —
 * 회사명 행이 영문 2행용 작은 높이(0.28/0.17/0.125H)가 아니라 **`HD`와 같은 높이**를 받는다.
 * 정본에 1행 영문 예시가 없어 스펙으로는 판정할 수 없는데, 이 해석을 택하면 **세 꼴의 영역 검산이
 * 전부 닫힌다**(가로형A 0.65 · 가로형B 0.4+0.1+0.4=0.9 · 세로형 0.3+0.1+0.3=0.7). 2행용 높이로 두면
 * 어느 꼴도 닫히지 않는다 — 그 정합성이 이 해석의 유일한 근거다.
 */
function nameRows(sub: Subsidiary, lang: 'ko' | 'en', form: (typeof FORMS)[FormKey]): Row[] {
	if (lang === 'ko' || sub.en.length === 1) {
		const text = lang === 'ko' ? sub.ko : caps(sub.en[0])
		return [{ text, cap: form.hdCap }]
	}
	return sub.en.map((text, i) => ({
		text: caps(text),
		cap: form.enCap,
		...(i === 1 ? { gapBefore: form.enRow2Gap } : {}),
	}))
}

/** 자회사 CI — 꼴 3종 × 국문·영문. */
function subsidiaryLockups(sub: Subsidiary): Lockup[] {
	return FORM_KEYS.flatMap((formKey) => {
		const form = FORMS[formKey]
		return (['ko', 'en'] as const).map((lang) => {
			const names = nameRows(sub, lang, form)
			// 🔴 가로형A 국문만 `HD` + 회사명이 한 행으로 붙는다. 나머지는 `HD`가 자기 행/열을 갖는다.
			const singleRow = lang === 'ko' && form.koSingleCap !== undefined
			const columns: Column[] = singleRow
				? [{ rows: [{ text: `HD${sub.ko}`, cap: form.koSingleCap }] }]
				: formKey === 'horizontalA'
					? [
							{ rows: [{ text: 'HD', cap: form.hdCap }] },
							{ gapBefore: form.columnGap, rows: names },
						]
					: [{ rows: [{ text: 'HD', cap: form.hdCap }, ...withHdGap(names)] }]

			return {
				key: `sub-${lang}-${formKey}`,
				label: `자회사 ${lang === 'ko' ? '국문' : '영문'} ${form.label}`,
				tier: 'subsidiary' as const,
				orientation: form.orientation,
				gap: form.gap,
				rowGap: HD_ROW_GAP,
				columns,
				...(singleRow ? {} : { area: form.area }),
				source: form.source,
				...(lang === 'en' && sub.en.length === 1 ? { note: ONE_LINE_EN_NOTE } : {}),
			}
		})
	})
}

/** 첫 계열사명 행에 `HD`와의 간격을 붙인다(이미 gapBefore가 있으면 그것을 지킨다). */
function withHdGap(rows: Row[]): Row[] {
	return rows.map((row, i) => (i === 0 ? { ...row, gapBefore: HD_ROW_GAP } : row))
}

/**
 * 해외지사 CI — 🔴 **영문 전용이다.** B.3 도판 9개(p35·37·39 + 색변형 p36·38·40)가 전부 영문이고
 * 국문 해외지사 락업은 존재하지 않는다. 예전 구현이 만들던 국문 3종은 도판에 없는 것이었다.
 *
 * 지부명이 붙는 축이 꼴마다 다르다:
 * - **가로형A**: 오른쪽에 새 열. 그 앞에 0.04H 폭 세로 구분바가 0.2H 간격 양쪽으로 끼인다.
 * - **가로형B**: 아래에 0.12H 행. 🔴 로고타입 영역 0.9H는 **자라지 않는다** — 앞 3행이 그대로
 *   0.9H를 채우고 지역명이 그 밖에 매달려 총 높이가 1.12H가 된다(총합 라벨은 없다).
 * - **세로형**: 아래에 0.1H 행. 영역이 0.7H → **0.9H로 자란다**(늘어난 0.2H = 간격 0.1H + 행 0.1H).
 */
function overseasLockups(sub: Subsidiary, branch: OverseasBranch): Lockup[] {
	const label = branchLabel(branch)

	return FORM_KEYS.map((formKey) => {
		const form = FORMS[formKey]
		const names = nameRows(sub, 'en', form)
		const base = {
			key: `ovs-${formKey}`,
			label: `해외지사 영문 ${form.label}`,
			tier: 'overseas' as const,
			orientation: form.orientation,
			gap: form.gap,
			rowGap: HD_ROW_GAP,
			source: form.source,
		}

		if (formKey === 'horizontalA') {
			// 지역명만이면 2행 그리드의 아래 행에 붙는다(실측 확정, 라벨 없음).
			const branchRows: Row[] = branch.business
				? [
						{ text: caps(branch.region), cap: form.enCap },
						{ text: caps(branch.business), cap: form.enCap, gapBefore: form.enRow2Gap },
					]
				: [{ text: caps(branch.region), cap: form.enCap }]
			return {
				...base,
				columns: [
					{ rows: [{ text: 'HD', cap: form.hdCap }] },
					{ gapBefore: form.columnGap, rows: names },
					{ gapBefore: form.columnGap, bar: BAR_WIDTH, rows: [] },
					{
						gapBefore: form.columnGap,
						rows: branchRows,
						...(branch.business ? {} : { align: 'bottom' as const }),
					},
				],
				area: form.area,
				source: `${form.source} / B.3 p35 · 구분바 폭 ${BAR_WIDTH}H · 열 간격 0.2H`,
				note: `구분바 폭은 라벨 ${BAR_WIDTH}H와 실측 0.0344H가 14% 어긋난다. 지역명 1개일 때 아래 행 하단정렬도 라벨 없이 실측으로 정한 것이다.`,
			}
		}

		const branchCap = formKey === 'horizontalB' ? 0.12 : 0.1
		return {
			...base,
			columns: [
				{
					rows: [
						{ text: 'HD', cap: form.hdCap },
						...withHdGap(names),
						{ text: label, cap: branchCap, gapBefore: HD_ROW_GAP },
					],
				},
			],
			// 🔴 가로형B의 0.9H는 총합이 아니라 앞 3행(= 자회사 블록)이다. 총합 라벨이 없어
			//    area를 비우고 부분 검산만 남기고, **심볼은 그 블록에 정렬한다**(2×2 그리드).
			...(formKey === 'horizontalB'
				? {
						baseRows: 1 + sub.en.length,
						...(sub.en.length === 2
							? { partialArea: { rows: 3, value: form.area } }
							: {}),
					}
				: { area: 0.9 }),
			source: `${form.source} / B.3 ${formKey === 'horizontalB' ? 'p37 · 지역명 0.12H · 심볼은 앞 3행에 정렬' : 'p39 · 지역명 0.1H · 영역 0.7H→0.9H'}`,
			...(formKey === 'horizontalB'
				? {
						note: `심볼 간격은 라벨 0.25H를 실측 0.2H가 뒤집은 값이다. 총 높이 1.12H에는 라벨이 없다.${
							sub.en.length === 1 ? ` ${ONE_LINE_EN_NOTE}` : ''
						}`,
					}
				: {
						note: '지역명 앞 간격 0.1H는 라벨이 없고 실측(13.98pt)과 계열 정합성만 근거다.',
					}),
		}
	})
}

/** 🔴 p35 라벨은 0.04H인데 실측은 0.0344H다(14% 차). 라벨을 정본으로 두고 차이를 note에 남긴다. */
const BAR_WIDTH = 0.04

/** 열 하나의 높이(H 배수). 행 cap 합 + 행 사이 간격 합. */
export function columnArea(lockup: Lockup, column: Column) {
	return column.rows.reduce(
		(sum, row, i) => sum + row.cap + (i === 0 ? 0 : (row.gapBefore ?? lockup.rowGap)),
		0,
	)
}

/** 앞 `count`개 행까지의 높이 — 라벨이 부분 블록을 가리킬 때의 검산용. */
export function partialColumnArea(lockup: Lockup, column: Column, count: number) {
	return columnArea(lockup, { ...column, rows: column.rows.slice(0, count) })
}

/** 위젯이 고르는 상태. 단계를 내려도 상위 입력은 보관한다(컨트롤이 그것을 소유한다). */
export type LockupState = { tier: Tier; subsidiary: Subsidiary; branch: OverseasBranch }

/**
 * 단계 + 선택으로 락업을 파생한다. 🔑 열거를 지운 자리다 — 미리 정한 13개를 나열하는 대신
 * 단계가 꼴 세트를 고르고 선택이 글자를 채운다.
 */
export function deriveLockups({ tier, subsidiary, branch }: LockupState): Lockup[] {
	if (tier === 'ci') return ciLockups()
	return tier === 'subsidiary'
		? subsidiaryLockups(subsidiary)
		: overseasLockups(subsidiary, branch)
}

export const TIER_LABEL: Record<Tier, string> = {
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
 * 🔴 글자꼴은 정본이 아니다 — 배치 비율만 정본이고 서체는 임시 대체다(FONT 주석).
 *
 * 정본 서체를 특정하려던 조사의 결론(2026-08-14): 정본 라틴 글자꼴은 브랜드팀이 준 로고 전용 서체
 * `HDHyundai_Logo`와 같다(`~/Downloads/브랜드 가이드/2. 서체/230317_HDHyundaiLogo_Font/`, 정점 환산
 * 대조 + 사용자 육안 겹침). 그전에 의심했던 "수작업 레터링"은 근거가 없어졌다 — 비교 대상이 **HD
 * 배포체였던 것이 문제**였다(같은 높이에서 정본보다 10% 좁고, 3종 어느 웨이트도 닿지 못한다).
 * 🔴 **그런데 그 로고 서체를 쓰지 않는다.** 한글이 없는 반쪽짜리라서, 락업 하나를 두 서체로 그리게
 *    된다 — 그것보다 한 서체로 통일하는 쪽이 낫다는 것이 사용자 결정이다.
 * 🔴 자간은 손으로 좁히지 않는다(letter-spacing: normal). 차이를 없애면 판정을 못 한다.
 */
export const FIDELITY_CAVEAT =
	'글자꼴은 정본 서체가 아니라 임시 대체 서체입니다. 배치 비율만 정본 규정을 따릅니다.'
