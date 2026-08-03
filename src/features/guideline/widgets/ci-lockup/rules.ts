// CI 락업 조립 규칙. 모든 값은 H(심볼/Forward Mark 높이) 배수 — .scratch/hd-reference/01-specs.md 출처.
// 🔴 여기 숫자를 눈대중으로 고치지 말 것. 정본과 어긋나면 브랜드팀과 상의해 스펙을 바꾼다(임의 조정 금지).
//
// 현재 범위 = 본사 CI 6유형(ko/en/hd × 가로/세로). 자회사·해외지사는 규칙 확보 후 tier를 추가한다.
// 미확정(브랜드팀 확인 필요):
//  - "워드마크 0.65H"의 0.65H가 무엇의 높이인가(cap height / 아웃라인 bbox / em box). 지금은 font-size = em box로 둔다.
//  - CI에 실제로 쓰인 폰트 웨이트. 정본은 아웃라인이라 확정 불가.
//  - 여러 행일 때 행 사이 간격. 지금은 행간 100%.

export type Orientation = 'horizontal' | 'vertical'
export type Wordmark = 'ko' | 'en' | 'hd'

/** 배치별 비율. 본사 CI는 언어와 무관하게 동일하다(01-specs A의 "공식"). */
export const LAYOUT: Record<
	Orientation,
	{
		/** 워드마크 높이 = H × 이 값 */
		wordmark: number
		/** 심볼–워드마크 간격 = H × 이 값 */
		gap: number
		/** 최소 여백(클리어스페이스) = H × 이 값 */
		clearSpace: number
		/** 예외 여백 — 사인물·제품·공간 조정 특수 케이스에 한해 */
		clearSpaceException: number
	}
> = {
	horizontal: { wordmark: 0.65, gap: 0.25, clearSpace: 0.5, clearSpaceException: 0.25 },
	vertical: { wordmark: 0.3, gap: 0.2, clearSpace: 0.4, clearSpaceException: 0.2 },
}

/** 워드마크 문자열. 행 배열 — 여러 행인 자회사/해외지사로 확장할 때 그대로 쓴다. */
export const WORDMARK_LINES: Record<Wordmark, string[]> = {
	ko: ['HD현대'],
	en: ['HD HYUNDAI'],
	hd: ['HD'],
}

export const WORDMARK_LABEL: Record<Wordmark, string> = {
	ko: '국문형',
	en: '영문형',
	hd: 'HD형',
}

export const ORIENTATION_LABEL: Record<Orientation, string> = {
	horizontal: '가로형',
	vertical: '세로형',
}

/** 최소 크기 규정 — 디지털/인쇄 고정값(H 배수가 아님). */
export const MIN_SIZE = { digitalPx: 16, printMm: 4 } as const

/** 색. 심볼 기본형은 파일에 색이 박혀 있어 여기서 다루지 않는다(금지 6: 색상 임의 변경 불가). */
export const COLOR = {
	/** 워드마크 남색 — 정본 락업의 cls-4 */
	wordmark: '#002f87',
	/** 텍스트박스 가시화용 배경(진녹 10%). 조립 결과가 어느 영역을 차지하는지 보이게 하는 진단용. */
	textBox: '#00733219',
} as const

/** 심볼 파일. default=기본형(색 고정), mono=fill로 색 지정 가능한 분리형. */
export const SYMBOL = {
	default: '/symbols/symbol-default.svg',
	mono: '/symbols/symbol-mono.svg',
	/** 심볼 원본 비율 — viewBox 51.96 × 60 */
	aspect: 51.96 / 60,
} as const
