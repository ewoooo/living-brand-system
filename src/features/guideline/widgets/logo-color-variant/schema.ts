import type { Block } from 'payload'

// 로고 색상 변형 위젯 — 하나의 로고를 [기본형 / WHITE 워드마크 / 단색 분리형] 2×2 그리드로 보여준다.
// 🔑 로고 파일을 위젯에 박지 않고 `logo` 필드로 받는다 = 위젯 1개를 모든 로고에 재사용(국문/영문/HD…).
// WHITE·단색은 기본형 로고에서 CSS 필터로 파생(자산 1개). 위젯은 image·text와 동급 leaf(rule 모름).
// dbName 짧게(lcv)로 중첩 테이블명 63자 방어.
export const LogoColorVariantWidget: Block = {
	slug: 'logoColorVariantWidget',
	dbName: 'lcv',
	interfaceName: 'LogoColorVariantWidget',
	labels: { singular: '로고 색상 변형 위젯', plural: '로고 색상 변형 위젯' },
	fields: [
		{
			name: 'logo',
			type: 'upload',
			relationTo: 'brand-logos',
			required: true,
			admin: { description: '기본형(풀컬러) 로고입니다. WHITE·단색은 여기서 파생됩니다.' },
		},
	],
}

export default LogoColorVariantWidget
