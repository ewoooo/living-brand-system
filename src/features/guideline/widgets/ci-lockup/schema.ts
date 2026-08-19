import type { Block } from 'payload'
import { CI_LOCKUP_CONTROL_IDS } from './manifest'

// CI 락업 조립 위젯 — Block children에 등록되는 인터랙티브 leaf. 인스턴스 입력 없이 자족 렌더(fields=[]).
//
// 단계(본사→자회사→해외지사)를 고르면 그 계층의 락업이 파생돼 나온다. 미리 정한 목록을 나열하는 것이
// 아니라 심볼 + 폰트 조판으로 조립하므로, 계열사·지부가 늘어도 배리언트가 곱셈으로 터지지 않는다.
//
// 🔴 컨트롤은 이 위젯이 그리지 않는다 — `manifest.ts`가 선언하고 하단 알약이 그린다(`docs/11` §4.1).
//    여기 필드는 그 알약을 **좁히는 제한**이다: 무엇을 켠 상태로 시작하고, 무엇을 아예 싣지 않을지.
//    변환은 `controllers/registry.ts`가 갖는다.
// 🔑 페이지가 무엇을 설명하는지가 여기서 정해진다 — 자회사 섹션의 페이지는 자회사를 켠 채로 열고
//    해외지사 컨트롤을 빼면, 그 페이지에서 해외지사 락업이 나올 길이 없다.
//
// dbName 짧게(cil)로 중첩 테이블명 63자 방어. slug 14자 → `alias-length.test.ts`가 지킨다.
export const CiLockupWidget: Block = {
	slug: 'ciLockupWidget',
	dbName: 'cil',
	interfaceName: 'CiLockupWidget',
	labels: { singular: 'CI 락업 위젯', plural: 'CI 락업 위젯' },
	fields: [
		{
			name: 'subsidiaryOn',
			type: 'checkbox',
			defaultValue: false,
			admin: { description: '자회사 CI를 켠 상태로 엽니다.' },
		},
		{
			name: 'branchOn',
			type: 'checkbox',
			defaultValue: false,
			admin: { description: '해외지사 CI를 켠 상태로 엽니다. 자회사가 켜져 있어야 합니다.' },
		},
		{
			name: 'hiddenControls',
			type: 'select',
			hasMany: true,
			// 🔑 목록은 매니페스트에서 온다 — 컨트롤을 늘리면 여기 선택지도 저절로 따라온다.
			options: CI_LOCKUP_CONTROL_IDS,
			admin: {
				description:
					'알약에서 뺄 컨트롤. 뺀 축은 위에서 정한 값에 고정됩니다(예: 자회사 섹션에서 해외지사 두 컨트롤).',
			},
		},
	],
}

export default CiLockupWidget
