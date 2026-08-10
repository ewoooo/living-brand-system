import type { Block } from 'payload'

// [임시] 클리어스페이스 오버레이 위젯 — 같은 canvas(viewBox)로 파싱된 두 레이어(로고=logoSpace, 그리드=clearSpace)를
// 정확히 겹쳐서 클리어스페이스 다이어그램을 만든다. 나중에 HTML 기반(H·비율 계산 렌더)으로 대체 예정.
// 🔑 두 SVG는 px scale이 맞춰져 있어(동일 viewBox) 같은 크기로 겹치면 정합. 스케일은 자기 크기 × (scalePercent/100).
// dbName 짧게(cso)로 중첩 테이블명 63자 방어.
export const ClearspaceOverlayWidget: Block = {
	slug: 'clearspaceOverlayWidget',
	dbName: 'cso',
	interfaceName: 'ClearspaceOverlayWidget',
	labels: { singular: '클리어스페이스(임시)', plural: '클리어스페이스(임시)' },
	fields: [
		{
			name: 'logoLayer',
			type: 'upload',
			relationTo: 'brand-logos',
			required: true,
			admin: { description: '로고 레이어(logoSpace). 그리드와 같은 canvas로 파싱된 SVG.' },
		},
		{
			name: 'gridLayer',
			type: 'upload',
			relationTo: 'brand-logos',
			required: true,
			admin: { description: '그리드 레이어(clearSpace). 로고와 같은 canvas.' },
		},
		{
			name: 'scalePercent',
			type: 'number',
			defaultValue: 100,
			min: 1,
			admin: { description: '표시 배율(%). 100 = 자기 크기 그대로. 자기 크기 × (값/100).' },
		},
	],
}

export default ClearspaceOverlayWidget
