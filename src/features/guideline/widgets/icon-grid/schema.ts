import type { Block } from 'payload'

// 아이콘 그리드 위젯 — Block children에 등록되는 인터랙티브 leaf. 인스턴스 입력 없이 자족 렌더(fields=[]).
// dbName 짧게(icw)로 중첩 테이블명 63자 방어.
export const IconGridWidget: Block = {
	slug: 'iconGridWidget',
	dbName: 'icw',
	interfaceName: 'IconGridWidget',
	labels: { singular: '아이콘 그리드 위젯', plural: '아이콘 그리드 위젯' },
	fields: [],
}

export default IconGridWidget
