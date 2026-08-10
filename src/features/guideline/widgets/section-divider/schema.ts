import type { Block } from 'payload'

// 섹션 표지 위젯 — 딥그린 면 위에 좌상단 2단 breadcrumb(챕터 / 섹션)을 흰 타이포로 얹는 챕터·섹션 표지.
// PDF 패턴 divider(p1·17·22)의 재현이라 표시 텍스트 4칸만 갖는다. 본문 산문·인터랙션 없음.
// 배경색·정렬·높이 옵션을 두지 않는 것은 의도다 — 딥그린 풀블리드가 이 위젯의 정체성이고 나머지는 YAGNI.
// 🔴 required·defaultValue 없음: 네 칸이 다 비어도 component가 p1 샘플로 폴백해 빈 화면이 되지 않는다.
// dbName 짧게(sdv)로 중첩 테이블명 63자 방어.
export const SectionDividerWidget: Block = {
	slug: 'sectionDividerWidget',
	dbName: 'sdv',
	interfaceName: 'SectionDividerWidget',
	labels: { singular: '섹션 표지 위젯', plural: '섹션 표지 위젯' },
	fields: [
		{
			type: 'row',
			fields: [
				{
					name: 'chapterCode',
					type: 'text',
					localized: true,
					admin: { width: '50%', description: '챕터 코드입니다(예: B).' },
				},
				{
					name: 'chapterTitle',
					type: 'text',
					localized: true,
					admin: {
						width: '50%',
						description: '챕터 제목입니다(예: BRAND DESIGN ELEMENTS).',
					},
				},
			],
		},
		{
			type: 'row',
			fields: [
				{
					name: 'sectionCode',
					type: 'text',
					localized: true,
					admin: { width: '50%', description: '섹션 코드입니다(예: B.1).' },
				},
				{
					name: 'sectionTitle',
					type: 'text',
					localized: true,
					admin: {
						width: '50%',
						description: '섹션 제목입니다(예: CI, 자회사 CI, KEY VISUAL).',
					},
				},
			],
		},
	],
}

export default SectionDividerWidget
