import type { Block } from 'payload'

// COLOR 사용 금지 위젯 — 가이드라인 54p의 금지 6종을 패널 카드로 보여준다.
// CI 금지(`incorrectUsageWidget`)와 다른 위젯이다: 저쪽은 로고 형태 변형 12종이고 여기는 컬러 6종이라
// 위반이 색만으로 그려진다(별도 나쁜예시 이미지가 필요 없다).
//
// 항목은 브랜드팀 아트워크에서 뽑은 상수라 author 입력이 없다(`misuses.ts`). 로고만 인스턴스로 받는다.
// 좌측 본문("사용 금지 규정" 설명)은 Block의 title·description이 소유한다 — 위젯이 갖지 않는다.
//
// dbName 짧게(ciu). slug는 25자라 조회 SQL 별칭이 51자에 머문다(alias-length.test.ts가 지킨다).
export const ColorIncorrectUsageWidget: Block = {
	slug: 'colorIncorrectUsageWidget',
	dbName: 'ciu',
	interfaceName: 'ColorIncorrectUsageWidget',
	labels: { singular: 'COLOR 사용 금지 위젯', plural: 'COLOR 사용 금지 위젯' },
	fields: [
		{
			// 파일명 규약 `{lang}-{orientation}-{default|white|mono}.svg`에서 나머지 변형을 찾는다.
			// logo-on-background와 같은 규약이라 조회를 `widgets/logo-set.ts`에서 공유한다.
			name: 'logo',
			type: 'upload',
			relationTo: 'brand-logos',
			admin: {
				description:
					'기준 로고입니다. 같은 언어·방향의 기본형/WHITE/단색형을 파일명 규약으로 함께 찾습니다.',
			},
		},
	],
}

export default ColorIncorrectUsageWidget
