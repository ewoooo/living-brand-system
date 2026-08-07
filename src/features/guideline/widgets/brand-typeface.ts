// Typography 섹션 위젯들이 공유하는 서체 상수. 값의 출처는 브랜드팀 SVG(Artboard 42~49)다.
//
// 🔴 지금 붙어 있는 HD체는 **CI 락업용 라틴 서브셋**이라 한글 글리프가 없고 Light(300)도 없다.
//    그래서 한글은 Pretendard로 폴백된다. 제대로 된 서체가 들어오면 theme.css의 @font-face만
//    갈아 끼우면 되고, 위젯은 손대지 않는다 — 그래서 위젯은 폰트에서 잰 수치를 상수로 박지 않는다.
//
// 🔴 react·이미지 import 금지(schema가 참조할 수 있다).

/** 브랜드 서체 스택. 한글이 없는 동안 본문 서체가 받아 준다. */
export const BRAND_FONT_STACK = '"HD", var(--font-body)'

/** 굵기 3종. 원본 Artboard 43이 BOLD / MEDIUM / LIGHT 3열로 보여 준다. */
export const WEIGHTS = [
	{ key: 'light', label: 'Light', value: 300 },
	{ key: 'medium', label: 'Medium', value: 500 },
	{ key: 'bold', label: 'Bold', value: 700 },
] as const
export type WeightKey = (typeof WEIGHTS)[number]['key']

/** 현재 배포 서체에 실제로 있는 굵기. 없는 굵기는 브라우저가 합성해 원본과 다르게 보인다. */
export const AVAILABLE_WEIGHTS: readonly number[] = [500, 700]

export const LANGUAGES = [
	{ key: 'ko', label: '국문' },
	{ key: 'en', label: '영문' },
	{ key: 'enCaps', label: '영문 (All Caps)' },
] as const
export type LanguageKey = (typeof LANGUAGES)[number]['key']

export const TIERS = [
	{ key: 'head', label: 'Head Copy', weight: 700 },
	{ key: 'sub', label: 'Sub Copy', weight: 700 },
	{ key: 'body', label: 'Body Copy', weight: 500 },
] as const
export type TierKey = (typeof TIERS)[number]['key']

/**
 * 언어 × 단계별 행간 규정(%). 원본 Artboard 46(국문)·47(영문)·48(영문 대문자)에서 그대로 옮겼다.
 * 🔴 이 섹션의 요점이 "언어가 바뀌면 행간 규정이 바뀐다"는 것이다 — 눈대중으로 고치지 말 것.
 */
export const LEADING: Record<LanguageKey, Record<TierKey, [number, number]>> = {
	ko: { head: [130, 140], sub: [140, 150], body: [150, 160] },
	en: { head: [115, 125], sub: [125, 135], body: [135, 145] },
	enCaps: { head: [105, 115], sub: [115, 125], body: [135, 145] },
}

/** 단계별 표시 크기(px). 원본 46~48의 60 / 30 / 17을 그대로 쓴다. */
export const TIER_SIZE: Record<TierKey, number> = { head: 60, sub: 30, body: 17 }

/** 원본 46~48의 예시 문단. 언어별로 같은 내용을 옮긴 것이다. */
export const SAMPLE_PARAGRAPH: Record<LanguageKey, Record<TierKey, string>> = {
	ko: {
		head: '새로운 50년을 만들어가는\n그룹의 지주회사 HD현대',
		sub: 'HD현대의 과거 50년은 도전과 성장으로\n우리나라 경제발전의 한 페이지를 작성한\n영광의 역사였습니다.',
		body: 'HD현대(주)는 그룹의 지주회사입니다. HD현대는 1972년 울산의 작은 어촌마을에서 조선사업을 시작해 해양플랜트, 기계, 로봇, 에너지 등으로 사업 영역을 넓히며 성장해왔습니다.',
	},
	en: {
		head: "The Group's holding company shaping\nthe next 50 years",
		sub: 'The past 50 years for HD Hyundai\nhave been a glorious history of\nchallenges and growth',
		body: 'HD Hyundai is the holding company of the group. Starting business as a shipbuilder at a small fishing village in 1972, HD Hyundai is progressing to be a Future Builder.',
	},
	enCaps: {
		head: "THE GROUP'S HOLDING COMPANY SHAPING\nTHE NEXT 50 YEARS",
		sub: 'THE PAST 50 YEARS FOR HD HYUNDAI\nHAVE BEEN A GLORIOUS HISTORY OF\nCHALLENGES AND GROWTH',
		body: 'HD Hyundai is the holding company of the group. Starting business as a shipbuilder at a small fishing village in 1972, HD Hyundai is progressing to be a Future Builder.',
	},
}

/** 굵기 비교용 한 덩어리 문구(Artboard 43). 위계가 없는 단일 텍스트다. */
export const WEIGHT_SAMPLE: Record<LanguageKey, string> = {
	ko: '시대를 이끄는 혁신과\n끊임없는 도전으로\n인류의 미래를 개척합니다',
	en: 'A FUTURE BUILDER,\nPIONEERING\nTHE FUTURE OF HUMANITY',
	enCaps: 'A FUTURE BUILDER,\nPIONEERING\nTHE FUTURE OF HUMANITY',
}

/** 스크램블 뷰어의 기본 목표 문자열(Artboard 42의 대표 문구). */
export const SCRAMBLE_DEFAULT = 'A FUTURE BUILDER'
