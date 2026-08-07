// 컬러 패널 프리셋 — 이미지가 아니라 색만으로 그려지는 나쁜예시다.
// 출처는 브랜드팀 SVG `0730_HD_Guidlines_All-54.svg`(가이드라인 54p)이고, 패널 색·밴드 위치·로고 변형을
// 그 아트워크에서 그대로 뽑았다. 눈대중으로 고치지 말 것.
//
// 🔴 여기 색은 전부 "위반 예시"라 brand-colors에 넣지 않는다 — 지정 컬러가 아닌 게 요점이다.
// 🔴 schema.ts가 이 파일의 PRESET_OPTIONS를 읽는다. payload.config는 Node에서 로드되므로
//    react·이미지 import를 절대 넣지 말 것(docs/11 §2).
//
// 예시를 CMS에 이미지로 올리지 않고 코드 프리셋으로 두는 이유: 색·그라디언트·투명도 중첩은
// 래스터 이미지로 만들면 원본 값이 사라진다. 키로 참조하면 조합이 문자열 하나로 표현된다.

/** 패널 위에 겹쳐 깔리는 띠. 폭 합이 100%를 넘어 서로 물린다 — 그 겹침이 보여줄 대상이다. */
export type Band = { color: string; leftPct: number; widthPct: number }

export type ColorPreset = {
	/** 패널 배경. CSS background 값 그대로 */
	panel: string
	/** 투명도·중첩 항목에만 있다 */
	bands?: Band[]
	/** 로고를 어떻게 그리나. `fill`이 있으면 단색형을 그 색으로 칠한다 */
	logo: { variant: 'default' | 'white' | 'mono'; fill?: string; opacity?: number }
}

/** 밴드 알파. SVG의 `opacity: .6`. */
export const BAND_OPACITY = 0.6

export const COLOR_PRESETS = {
	'off-palette': {
		panel: '#3C0087',
		logo: { variant: 'mono', fill: '#002F87' },
	},
	gradient: {
		// SVG의 linear-gradient 4스톱(좌→우) 그대로.
		panel: 'linear-gradient(90deg, #00AF41 0%, #009A3B 28%, #007D34 74%, #007332 100%)',
		logo: { variant: 'white' },
	},
	'low-contrast': {
		panel: '#4D4D4D',
		logo: { variant: 'mono', fill: '#666666' },
	},
	'unpaired-combo': {
		panel: '#000A32',
		logo: { variant: 'default' },
	},
	'overlay-stack': {
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
	'brightness-opacity': {
		panel: '#000000',
		logo: { variant: 'default', opacity: 0.6 },
	},
} as const satisfies Record<string, ColorPreset>

export type ColorPresetKey = keyof typeof COLOR_PRESETS

/** admin select용. 라벨은 브랜드팀 캡션을 줄인 것이다. */
export const PRESET_OPTIONS = [
	{ label: '지정 컬러 외 컬러', value: 'off-palette' },
	{ label: '그라디언트 적용', value: 'gradient' },
	{ label: '명도 대비 낮음', value: 'low-contrast' },
	{ label: '지정되지 않은 배색 조합', value: 'unpaired-combo' },
	{ label: '투명도·컬러 중첩', value: 'overlay-stack' },
	{ label: '밝기 변형 + 투명도', value: 'brightness-opacity' },
] as const
