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

export type IconColorwayEntry = { fg: string; bg: string }

export const ICON_COLORWAY: Record<string, IconColorwayEntry> = {
	'1.svg': { bg: 'Essenherb Red', fg: 'Yellow 2' },
	'2.svg': { bg: 'Blue 1', fg: 'Essenherb Red' },
	'3.svg': { bg: 'Yellow 3', fg: 'Yellow 5' },
	'4.svg': { bg: 'Purple 1', fg: 'Purple 3' },
	'5.svg': { bg: 'Green 3', fg: 'Yellow 3' },
	'6.svg': { bg: 'Yellow 1', fg: 'Green 3' },
	'7.svg': { bg: 'Purple 1', fg: 'Essenherb Red' },
	'8.svg': { bg: 'Green 5', fg: 'Green 3' },
	'11.svg': { bg: 'Blue 3', fg: 'Blue 2' },
	'12.svg': { bg: 'Purple 3', fg: 'Red 2' },
	'13.svg': { bg: 'Green 1', fg: 'Green 3' },
	'14.svg': { bg: 'Essenherb Red', fg: 'White' },
	'15.svg': { bg: 'Blue 2', fg: 'Blue 5' },
	'16.svg': { bg: 'Purple 1', fg: 'Green 3' },
	'17.svg': { bg: 'Green 2', fg: 'Blue 3' },
	'18.svg': { bg: 'Blue 3', fg: 'White' },
	'21.svg': { bg: 'Yellow 1', fg: 'Yellow 4' },
	'22.svg': { bg: 'Essenherb Red', fg: 'Red 4' },
	'23.svg': { bg: 'Blue 3', fg: 'Blue 5' },
	'24.svg': { bg: 'Blue 1', fg: 'Essenherb Red' },
	'25.svg': { bg: 'Yellow 3', fg: 'Red 4' },
	'26.svg': { bg: 'Blue 1', fg: 'Blue 2' },
	'27.svg': { bg: 'Yellow 3', fg: 'Essenherb Red' },
	'28.svg': { bg: 'Blue 5', fg: 'Blue 3' },
	'31.svg': { bg: 'Green 1', fg: 'Essenherb Red' },
	'32.svg': { bg: 'Blue 1', fg: 'Green 3' },
	'33.svg': { bg: 'Green 2', fg: 'Green 4' },
	'34.svg': { bg: 'Purple 5', fg: 'Yellow 3' },
	'35.svg': { bg: 'Blue 2', fg: 'Blue 3' },
	'37.svg': { bg: 'Essenherb Red', fg: 'Red 2' },
	'38.svg': { bg: 'Green 3', fg: 'Green 2' },
	'41.svg': { bg: 'Purple 1', fg: 'Purple 3' },
	'42.svg': { bg: 'Yellow 3', fg: 'Essenherb Red' },
	'43.svg': { bg: 'Red 1', fg: 'Blue 2' },
	'44.svg': { bg: 'Blue 2', fg: 'Essenherb Red' },
	'45.svg': { bg: 'Green 3', fg: 'Yellow 3' },
	'46.svg': { bg: 'Essenherb Red', fg: 'Yellow 1' },
	'47.svg': { bg: 'Yellow 3', fg: 'Blue 3' },
	'48.svg': { bg: 'Purple 5', fg: 'Green 2' },
	'363.svg': { bg: 'Yellow 3', fg: 'Yellow 5' },
}
