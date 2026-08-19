import type { Block } from 'payload'

// CI 락업 조립 위젯 — Block children에 등록되는 인터랙티브 leaf. 인스턴스 입력 없이 자족 렌더(fields=[]).
//
// 단계(본사→자회사→해외지사)를 고르면 그 계층의 락업이 파생돼 나온다. 미리 정한 목록을 나열하는 것이
// 아니라 심볼 + 폰트 조판으로 조립하므로, 계열사·지부가 늘어도 배리언트가 곱셈으로 터지지 않는다.
//
// 🔴 저작 옵션을 아직 두지 않는다. 클리어스페이스 노출 같은 「페이지가 무엇을 설명하는가」는
//    인스턴스 필드가 될 자리지만(`docs/11` §4의 select 형태), 그 기능 스펙이 정해지기 전에
//    필드를 미리 만들지 않는다 — 스키마 변경은 마이그레이션을 낳으므로 되돌리는 값이 비싸다.
//
// dbName 짧게(cil)로 중첩 테이블명 63자 방어. slug 14자 → `alias-length.test.ts`가 지킨다.
export const CiLockupWidget: Block = {
	slug: 'ciLockupWidget',
	dbName: 'cil',
	interfaceName: 'CiLockupWidget',
	labels: { singular: 'CI 락업 위젯', plural: 'CI 락업 위젯' },
	fields: [],
}

export default CiLockupWidget
