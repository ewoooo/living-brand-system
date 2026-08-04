import type { Block } from 'payload'
import { SAMPLE_OPTIONS } from './samples'

// 레이아웃 그리드 위젯 — Block children에 등록되는 인터랙티브 leaf.
// 조합 데이터는 코드(compositions.ts)에 있고, 인스턴스는 그중 어느 것을 렌더할지만 고른다.
// 🔴 옵션은 samples.ts를 그대로 쓴다 — 키를 두 곳에 적으면 조합만 추가하고 옵션을 빼먹는 사고가 난다.
//    (samples.ts는 에셋을 import하지 않아 Payload 설정 로딩에서 안전하다.)
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
			options: SAMPLE_OPTIONS.map(({ value, label }) => ({ value, label })),
			admin: { description: '코드에 정의된 조합 중 하나입니다.' },
		},
		{
			name: 'guides',
			type: 'select',
			defaultValue: 'shared',
			enumName: 'enum_lgw_guides',
			options: [
				{ label: '컨트롤 패널을 따름', value: 'shared' },
				{ label: '항상 켜짐', value: 'on' },
				{ label: '항상 꺼짐', value: 'off' },
			],
			admin: {
				description:
					'그리드 표시입니다. 같은 페이지의 판형끼리 다르게 두려면 켜짐·꺼짐으로 고정합니다.',
			},
		},
	],
}

export default LayoutGridWidget
