// 아이콘 컬러웨이 — 아이콘(svg 파일)별 전경/배경 색 조합.
//
// ponytail: 지금은 "어떤 아이콘에 어떤 두 색을 쓸지" 정하는 색상 조합 알고리즘이 명확하지 않아,
//   브랜딩팀이 손으로 고른 조합을 정적 데이터로 박아 둔다. 색 값 자체가 아니라 브랜드 팔레트
//   색 "이름"을 참조하므로(brand-colors에서 런타임 해석), 팔레트 hex가 바뀌면 그대로 따라간다.
//   추후 대비(contrast) 기반 색상 조합 알고리즘을 고도화하면, 이 정적 매핑 없이도 임의의
//   아이콘·배경에 대해 실시간으로 고대비 조합을 산출할 수 있다 → 그때 이 파일은 사라진다.
//
// 에셋급(로고·컬러·서체·아이콘)이 아니라 "임시 저작 데이터"라 CMS 컬렉션이 아닌 코드로 둔다.
// 키는 안정적인 svg 파일명, 값은 brand-colors의 색 이름.
// 색 이름이 전부 `.essenherb`로 끝나는 것은 이 조합이 레거시 essenherb 팔레트 전용이기 때문이다
// (HD현대 컬러가 기본이라 접미사가 없다). 아이콘 자체가 essenherb 에셋이라 HD 색으로 갈아탈 일이 없다.

export type IconColorwayEntry = { fg: string; bg: string }

export const ICON_COLORWAY: Record<string, IconColorwayEntry> = {
	'1.svg': { bg: 'essenherb-red.essenherb', fg: 'yellow-2.essenherb' },
	'2.svg': { bg: 'blue-1.essenherb', fg: 'essenherb-red.essenherb' },
	'3.svg': { bg: 'yellow-3.essenherb', fg: 'yellow-5.essenherb' },
	'4.svg': { bg: 'purple-1.essenherb', fg: 'purple-3.essenherb' },
	'5.svg': { bg: 'green-3.essenherb', fg: 'yellow-3.essenherb' },
	'6.svg': { bg: 'yellow-1.essenherb', fg: 'green-3.essenherb' },
	'7.svg': { bg: 'purple-1.essenherb', fg: 'essenherb-red.essenherb' },
	'8.svg': { bg: 'green-5.essenherb', fg: 'green-3.essenherb' },
	'11.svg': { bg: 'blue-3.essenherb', fg: 'blue-2.essenherb' },
	'12.svg': { bg: 'purple-3.essenherb', fg: 'red-2.essenherb' },
	'13.svg': { bg: 'green-1.essenherb', fg: 'green-3.essenherb' },
	'14.svg': { bg: 'essenherb-red.essenherb', fg: 'white.essenherb' },
	'15.svg': { bg: 'blue-2.essenherb', fg: 'blue-5.essenherb' },
	'16.svg': { bg: 'purple-1.essenherb', fg: 'green-3.essenherb' },
	'17.svg': { bg: 'green-2.essenherb', fg: 'blue-3.essenherb' },
	'18.svg': { bg: 'blue-3.essenherb', fg: 'white.essenherb' },
	'21.svg': { bg: 'yellow-1.essenherb', fg: 'yellow-4.essenherb' },
	'22.svg': { bg: 'essenherb-red.essenherb', fg: 'red-4.essenherb' },
	'23.svg': { bg: 'blue-3.essenherb', fg: 'blue-5.essenherb' },
	'24.svg': { bg: 'blue-1.essenherb', fg: 'essenherb-red.essenherb' },
	'25.svg': { bg: 'yellow-3.essenherb', fg: 'red-4.essenherb' },
	'26.svg': { bg: 'blue-1.essenherb', fg: 'blue-2.essenherb' },
	'27.svg': { bg: 'yellow-3.essenherb', fg: 'essenherb-red.essenherb' },
	'28.svg': { bg: 'blue-5.essenherb', fg: 'blue-3.essenherb' },
	'31.svg': { bg: 'green-1.essenherb', fg: 'essenherb-red.essenherb' },
	'32.svg': { bg: 'blue-1.essenherb', fg: 'green-3.essenherb' },
	'33.svg': { bg: 'green-2.essenherb', fg: 'green-4.essenherb' },
	'34.svg': { bg: 'purple-5.essenherb', fg: 'yellow-3.essenherb' },
	'35.svg': { bg: 'blue-2.essenherb', fg: 'blue-3.essenherb' },
	'37.svg': { bg: 'essenherb-red.essenherb', fg: 'red-2.essenherb' },
	'38.svg': { bg: 'green-3.essenherb', fg: 'green-2.essenherb' },
	'41.svg': { bg: 'purple-1.essenherb', fg: 'purple-3.essenherb' },
	'42.svg': { bg: 'yellow-3.essenherb', fg: 'essenherb-red.essenherb' },
	'43.svg': { bg: 'red-1.essenherb', fg: 'blue-2.essenherb' },
	'44.svg': { bg: 'blue-2.essenherb', fg: 'essenherb-red.essenherb' },
	'45.svg': { bg: 'green-3.essenherb', fg: 'yellow-3.essenherb' },
	'46.svg': { bg: 'essenherb-red.essenherb', fg: 'yellow-1.essenherb' },
	'47.svg': { bg: 'yellow-3.essenherb', fg: 'blue-3.essenherb' },
	'48.svg': { bg: 'purple-5.essenherb', fg: 'green-2.essenherb' },
	'363.svg': { bg: 'yellow-3.essenherb', fg: 'yellow-5.essenherb' },
}
