import type { Block } from 'payload'
import { FORM_OPTIONS, NAME_EN_DEFAULT, NAME_KO_DEFAULT } from './rules'

// 자회사 CI 그리드 스펙 위젯 — Block children에 등록되는 leaf.
// 🔴 치수 값 필드는 없다. H 배수는 브랜드 규정 상수(rules.ts)라 author가 못 고치는 게 정상이다.
// 🔴 로고 upload 필드도 없다 — 자회사 로고 에셋이 리포에 0건이라 지금 만들면 항상 빈 필드다.
//    규격은 심볼 + HD 웹폰트 조립만으로 성립한다. 에셋이 들어오면 그때 upload 1개를 더한다.
// 🔴 옵션은 rules.ts의 FORM_OPTIONS를 그대로 쓴다 — 키를 두 곳에 적으면 한쪽만 늘어난다.
//    (rules.ts는 react·에셋을 import하지 않아 Payload 설정 로딩에서 안전하다.)
// dbName 짧게(lgs)로 중첩 테이블명 63자 방어. enum은 전역 이름 공유라 enumName 명시.
export const LogoGridSpecWidget: Block = {
	slug: 'logoGridSpecWidget',
	dbName: 'lgs',
	interfaceName: 'LogoGridSpecWidget',
	labels: { singular: '로고 그리드 스펙 위젯', plural: '로고 그리드 스펙 위젯' },
	fields: [
		{
			name: 'form',
			type: 'select',
			defaultValue: 'horizontalA',
			enumName: 'enum_lgs_form',
			options: FORM_OPTIONS.map(({ value, label }) => ({ value, label })),
			admin: {
				description:
					'어느 그리드 규격인지 고릅니다. 치수 값은 규정 상수라 편집할 수 없습니다.',
			},
		},
		{
			name: 'nameKo',
			type: 'text',
			localized: true,
			defaultValue: NAME_KO_DEFAULT,
			admin: { description: '국문 조합에 넣을 자회사명입니다.' },
		},
		{
			name: 'nameEn',
			type: 'textarea',
			localized: true,
			defaultValue: NAME_EN_DEFAULT,
			admin: {
				description:
					'영문 상하조합의 아래 블록입니다. 한 줄이 한 행이 됩니다(상단 HD는 그룹 공통이라 고정).',
			},
		},
	],
}

export default LogoGridSpecWidget
