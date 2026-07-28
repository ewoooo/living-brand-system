// Tone in Tone 페어링 추천 — essenherb 가이드 p27(Light)·p28(Dark)의 큐레이션 40종 조합을 그대로 옮긴 정적 데이터.
//
// ponytail: 조합이 규칙으로 안 떨어지는 큐레이션이라(yellow 특별취급, Light col1의 gray 배경 등) 원본 그리드를
//   1:1로 캡처해 정적으로 둔다. color-pairing 블록의 병용 "규칙"과 달리 이건 브랜딩팀이 손으로 고른 "추천"이다.
//   색은 hex가 아니라 brand-colors의 `colorGroup-tone` 키로 참조하므로 팔레트 hex가 바뀌면 그대로 따라간다(브랜드 무관).
//
// 각 타일 = { bg, logo } = 배경색 키 + 그 위 워드마크(단색) 색 키. 원본은 5행 × 8열, 행 = 색 계열.

export type RecommendationVariant = 'light' | 'dark'
export type RecommendationTile = { bg: string; logo: string }

const t = (bg: string, logo: string): RecommendationTile => ({ bg, logo })

export const PAIRING_RECOMMENDATIONS: Record<RecommendationVariant, RecommendationTile[]> = {
	// Light(p27): 배경 = 톤1(연)·톤3(채도)·col1 gray-1, 로고 = 반대 톤의 다른 계열.
	light: [
		// red
		t('gray-1', 'red-3'),
		t('red-1', 'green-3'),
		t('red-1', 'blue-3'),
		t('red-1', 'purple-3'),
		t('red-3', 'yellow-1'),
		t('red-3', 'green-1'),
		t('red-3', 'blue-1'),
		t('red-3', 'purple-1'),
		// green
		t('gray-1', 'green-3'),
		t('green-1', 'red-3'),
		t('green-1', 'blue-3'),
		t('green-1', 'purple-3'),
		t('green-3', 'red-1'),
		t('green-3', 'yellow-1'),
		t('green-3', 'blue-1'),
		t('green-3', 'purple-1'),
		// blue
		t('gray-1', 'blue-3'),
		t('blue-1', 'red-3'),
		t('blue-1', 'green-3'),
		t('blue-1', 'purple-3'),
		t('blue-3', 'red-1'),
		t('blue-3', 'yellow-1'),
		t('blue-3', 'green-1'),
		t('blue-3', 'purple-1'),
		// purple
		t('gray-1', 'purple-3'),
		t('purple-1', 'red-3'),
		t('purple-1', 'green-3'),
		t('purple-1', 'blue-3'),
		t('purple-3', 'red-1'),
		t('purple-3', 'yellow-1'),
		t('purple-3', 'green-1'),
		t('purple-3', 'blue-1'),
		// yellow
		t('yellow-1', 'red-3'),
		t('yellow-1', 'green-3'),
		t('yellow-1', 'blue-3'),
		t('yellow-1', 'purple-3'),
		t('yellow-3', 'red-3'),
		t('yellow-3', 'green-3'),
		t('yellow-3', 'blue-3'),
		t('yellow-3', 'purple-3'),
	],
	// Dark(p28): 배경 = 톤4·톤5(어두움), 로고 = 다른 계열 톤2(연함, yellow 행만 톤1 일부).
	dark: [
		// red
		t('red-4', 'yellow-2'),
		t('red-4', 'green-2'),
		t('red-4', 'blue-2'),
		t('red-4', 'purple-2'),
		t('red-5', 'yellow-2'),
		t('red-5', 'green-2'),
		t('red-5', 'blue-2'),
		t('red-5', 'purple-2'),
		// green
		t('green-4', 'red-2'),
		t('green-4', 'yellow-2'),
		t('green-4', 'blue-2'),
		t('green-4', 'purple-2'),
		t('green-5', 'red-2'),
		t('green-5', 'yellow-2'),
		t('green-5', 'blue-2'),
		t('green-5', 'purple-2'),
		// blue
		t('blue-4', 'red-2'),
		t('blue-4', 'yellow-2'),
		t('blue-4', 'green-2'),
		t('blue-4', 'purple-2'),
		t('blue-5', 'red-2'),
		t('blue-5', 'yellow-2'),
		t('blue-5', 'green-2'),
		t('blue-5', 'purple-2'),
		// purple
		t('purple-4', 'red-2'),
		t('purple-4', 'yellow-2'),
		t('purple-4', 'green-2'),
		t('purple-4', 'blue-2'),
		t('purple-5', 'red-2'),
		t('purple-5', 'yellow-2'),
		t('purple-5', 'green-2'),
		t('purple-5', 'blue-2'),
		// yellow
		t('yellow-4', 'red-1'),
		t('yellow-4', 'green-1'),
		t('yellow-4', 'blue-1'),
		t('yellow-4', 'purple-1'),
		t('yellow-5', 'red-2'),
		t('yellow-5', 'green-2'),
		t('yellow-5', 'blue-2'),
		t('yellow-5', 'purple-2'),
	],
}
