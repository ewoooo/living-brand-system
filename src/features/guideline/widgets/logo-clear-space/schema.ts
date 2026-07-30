import type { Block } from 'payload'

// 로고 클리어스페이스 위젯 — 지금은 "로고 뷰잉"만(여백 안에 로고 배치). 정밀 클리어스페이스/최소크기 오버레이는 추후.
// 🔑 logo 필드로 로고를 받는 재사용 위젯(logoColorVariant과 동형). 위젯은 image·text 동급 leaf(rule 모름).
// dbName 짧게(lcs)로 중첩 테이블명 63자 방어.
export const LogoClearSpaceWidget: Block = {
	slug: 'logoClearSpaceWidget',
	dbName: 'lcs',
	interfaceName: 'LogoClearSpaceWidget',
	labels: { singular: '로고 클리어스페이스 위젯', plural: '로고 클리어스페이스 위젯' },
	fields: [
		{
			name: 'logo',
			type: 'upload',
			relationTo: 'brand-logos',
			required: true,
			admin: { description: '표시할 로고입니다.' },
		},
	],
}

export default LogoClearSpaceWidget
