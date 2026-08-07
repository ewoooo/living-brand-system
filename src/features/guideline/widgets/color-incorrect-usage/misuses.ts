// COLOR 사용 금지 6종. 값의 출처는 브랜드팀 SVG `0730_HD_Guidlines_All-54.svg`(가이드라인 54p)이고,
// 캡션 문구·패널 색·밴드 위치는 그 아트워크에서 그대로 뽑았다. 눈대중으로 고치지 말 것.
//
// 🔴 여기 색은 전부 "위반 예시"라 brand-colors에 넣지 않는다 — 지정 컬러가 아닌 게 요점이다.
//    react·에셋 import 없는 순수 데이터로 둔다(schema가 참조해도 안전하게).

/** 패널 위에 겹쳐 깔리는 띠. 폭 합이 100%를 넘어 서로 물린다 — 그 겹침이 보여줄 대상이다. */
export type Band = { color: string; leftPct: number; widthPct: number }

export type Misuse = {
	/** SVG-54의 칸 번호 (INCORRECT USAGE N) */
	no: number
	/** 빨간 캡션 원문 */
	caption: string
	/** 패널 배경. CSS background 값 그대로 */
	panel: string
	/** 투명도·중첩 항목에만 있다 */
	bands?: Band[]
	/** 로고를 어떻게 그리나. `fill`이 있으면 단색형을 그 색으로 칠한다 */
	logo: { variant: 'default' | 'white' | 'mono'; fill?: string; opacity?: number }
	/** 🔴 브랜드팀이 원본에 분홍 사선 + "수정필요"로 표시한 칸 = 아직 확정 안 된 예시 */
	needsBrandReview?: boolean
}

export const MISUSES: Misuse[] = [
	{
		no: 1,
		caption: '지정 컬러 외 컬러를 사용할 수 없습니다.',
		panel: '#3C0087',
		logo: { variant: 'mono', fill: '#002F87' },
	},
	{
		no: 2,
		caption: '지정 컬러를 그라디언트로 적용할 수 없습니다.',
		// SVG의 linear-gradient 4스톱(좌→우) 그대로.
		panel: 'linear-gradient(90deg, #00AF41 0%, #009A3B 28%, #007D34 74%, #007332 100%)',
		logo: { variant: 'white' },
	},
	{
		no: 3,
		caption: '명도 대비가 낮은 배색을 사용할 수 없습니다.',
		panel: '#4D4D4D',
		logo: { variant: 'mono', fill: '#666666' },
	},
	{
		no: 4,
		caption: '지정되지 않은 배색 조합을 사용할 수 없습니다.',
		panel: '#000A32',
		logo: { variant: 'default' },
	},
	{
		no: 5,
		caption: '투명도 효과 적용 및 컬러 중첩을 사용할 수 없습니다.',
		panel: '#000000',
		// 🔴 알파는 일부러 띠마다 준다. 보통은 그룹째로 투명하게 해서 겹침이 진해지는 걸 피하지만
		//    (widget-css-traps), 여기서는 그 누적이 바로 "컬러 중첩"이라 없애면 예시가 무의미해진다.
		bands: [
			{ color: '#73D75A', leftPct: 0, widthPct: 26.06 },
			{ color: '#00AF41', leftPct: 18.91, widthPct: 31.09 },
			{ color: '#007332', leftPct: 39.89, widthPct: 47.61 },
			{ color: '#00280A', leftPct: 75, widthPct: 25 },
		],
		logo: { variant: 'white' },
	},
	{
		no: 6,
		caption: 'Brightness Variation 중 명도 대비가 낮은 배색을 사용할 수 없습니다.',
		panel: '#000000',
		logo: { variant: 'default', opacity: 0.6 },
		// 원본 아트워크가 캡션(명도 대비)과 맞지 않는다 — 그려진 건 투명도다. 브랜드팀이 그래서 표시했다.
		needsBrandReview: true,
	},
]

/** 밴드 알파. SVG의 `opacity: .6`. */
export const BAND_OPACITY = 0.6
