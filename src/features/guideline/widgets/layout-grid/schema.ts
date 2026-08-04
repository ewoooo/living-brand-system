import type { Block } from 'payload'

// 레이아웃 그리드 위젯 — Block children에 등록되는 인터랙티브 leaf.
// 샘플 디자인은 코드(component.tsx의 SAMPLES)에 있고, 인스턴스는 그중 어느 것을 렌더할지만 고른다.
// dbName 짧게(lgw)로 중첩 테이블명 63자 방어.
export const LayoutGridWidget: Block = {
	slug: 'layoutGridWidget',
	dbName: 'lgw',
	interfaceName: 'LayoutGridWidget',
	labels: { singular: '레이아웃 그리드 위젯', plural: '레이아웃 그리드 위젯' },
	fields: [
		{
			name: 'sample',
			type: 'select',
			defaultValue: 'a',
			enumName: 'enum_lgw_sample',
			options: [
				{ label: '예시 A — 밝은 배경', value: 'a' },
				{ label: '예시 B — 어두운 배경', value: 'b' },
				{ label: '예시 C — 타이틀형', value: 'c' },
			],
			admin: { description: '코드에 정의된 샘플 디자인 중 하나입니다.' },
		},
	],
}

export default LayoutGridWidget
