import type { Block } from 'payload'

// 개념 소개 위젯 — PDF 패턴 A개념(p2 "CI 디자인 컨셉"). 좌 텍스트(리드 + 본문) / 우 대형 로고의 2단 덩어리.
// HD PDF의 지배적 레이아웃이라 CI 말고 다른 개념 페이지에도 그대로 재사용한다.
// 🔴 제목('CI')·부제('디자인 컨셉')는 Block의 title·description 소관이라 필드로 두지 않는다.
//    좌우 반전·컬럼 비율·로고 크기 필드도 두지 않는다 — 셀 폭 기준 cqw로 충분하다.
// dbName 짧게(cin)로 중첩 테이블명 63자 방어.
export const ConceptIntroWidget: Block = {
	slug: 'conceptIntroWidget',
	dbName: 'cin',
	interfaceName: 'ConceptIntroWidget',
	labels: { singular: '개념 소개 위젯', plural: '개념 소개 위젯' },
	fields: [
		{
			name: 'lead',
			type: 'textarea',
			localized: true,
			admin: { description: '좌측 컬럼 첫 줄(리드 문장)입니다.' },
		},
		{
			name: 'body',
			type: 'textarea',
			localized: true,
			admin: { description: '리드 아래 본문 단락입니다.' },
		},
		{
			name: 'logo',
			type: 'upload',
			relationTo: 'brand-logos',
			admin: { description: '우측에 크게 표시할 로고입니다. 비우면 기본 심볼을 보여줍니다.' },
		},
	],
}

export default ConceptIntroWidget
