import { fontSizeFor, LAYOUT, SYMBOL } from '@/features/guideline/widgets/ci-lockup/rules'

// p14 'CI 단색 분리형' 규정 데이터. 출처: .scratch/hd-reference/02-copy.md p14 · 01-specs.md A·D.
// 🔴 react·에셋을 import하지 않는다 — Payload schema(Node)와 위젯(Next) 양쪽에서 참조된다.
// 🔴 분리형 전용 치수 상수가 없는 것은 누락이 아니다. p14는 수치를 정하지 않고 "비율과 사용에 대한
//    기본 규칙은 CI 최소 여백 규정과 최소 크기 규정예시를 참조한다"고만 말한다. 그래서 조립 비율은
//    01-specs A 가로형 정본(ci-lockup/rules.ts)을 그대로 읽고, 이 위젯은 치수선을 그리지 않는다.

export type ApplicationType = 'sign' | 'effect'

/** 분리형 사용이 허용되는 조건 2종(01-specs D). 자유 텍스트가 아니라 select인 이유다. */
export const APPLICATION_TYPE_LABEL: Record<ApplicationType, string> = {
	sign: '사인물',
	effect: '특수효과',
}

/** schema select용. 라벨 정본은 위 맵 하나다. */
export const APPLICATION_TYPE_OPTIONS = Object.entries(APPLICATION_TYPE_LABEL).map(
	([value, label]) => ({ label, value }),
)

/** 배리언트 기본값 — p14 displayCopy. 로고 pin이 없으면 조립 샘플로 그린다(component 참조). */
export const SAMPLE_VARIANT_LABEL = 'CI 국문 - 가로형'
export const SAMPLE_WORDMARK = 'HD현대'

/** 조립 샘플의 표시 크기(px). ci-lockup(H=120)과 같은 성격의 표시값이다. */
const H = 56

/**
 * 조립 샘플. H만 화면에서 읽히는 크기로 잡은 표시값이고 **비율은 눈대중 값이 하나도 없다** —
 * 워드마크 0.65H · 간격 0.25H 전부 01-specs A 가로형 정본(LAYOUT.horizontal)에서 읽는다.
 * 🔑 p14의 "Gap"은 심볼–워드마크 간격이 아니라 단색 아트워크 **안의** 간격이다: symbol-mono.svg의
 *    세 면이 기본형 대비 안쪽으로 물러나 서로 떨어져 있다(면적 519.6→462.6 · 1039.2→940.0).
 *    그래서 간격은 기본형과 같은 0.25H를 쓰고, "분리형"임은 mono 파일이 만든다.
 * 🔴 이 숫자들을 규정처럼 화면에 라벨로 찍지 말 것(치수 제시는 clearspace-viewer·ci-lockup 소관).
 */
export const SAMPLE_LOCKUP = {
	symbolSrc: SYMBOL.mono,
	symbolHeight: H,
	symbolWidth: H * SYMBOL.aspect,
	// 🔴 font-size가 아니라 cap 높이가 0.65H다 — 그대로 font-size로 쓰면 글자가 규정보다 작다.
	//    환산은 ci-lockup/rules.ts의 fontSizeFor 하나가 소유한다.
	wordmarkSize: fontSizeFor(LAYOUT.horizontal.wordmark, H),
	gap: H * LAYOUT.horizontal.gap,
	/** 단색 분리형 원본은 검정 잉크다(symbol-mono.svg에 fill이 없어 black) — 워드마크도 같은 잉크로 맞춘다. */
	ink: '#000',
	/** 🔴 임시 리터럴 — 검정 잉크 아트워크는 밝은 면 위에서만 성립한다. chrome이 아니라 위젯이 칠하는 콘텐츠 면이다. */
	stage: '#fff',
} as const

/** 적용 카드 기본값 — 둘 다 이미지가 없는 p14 원본 상태 그대로다. */
export const SAMPLE_APPLICATIONS: {
	type: ApplicationType
	caption: string
	note?: string
}[] = [
	{ type: 'sign', caption: '사인물의 경우 Full Color로 CI 분리형을 사용한다.' },
	{
		type: 'effect',
		caption: '양각(엠보싱), 특수박 인쇄(메탈 프린팅) 등 특수효과 적용 시 CI 분리형을 사용한다.',
		note: '후가공 예시 추가 예정',
	},
]
