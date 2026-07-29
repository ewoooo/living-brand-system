import type { Block } from 'payload'

// 레이아웃 그리드 위젯 — Block children에 등록되는 인터랙티브 leaf. 인스턴스 입력 없이 자족 렌더(fields=[]).
// dbName 짧게(lgw)로 중첩 테이블명 63자 방어.
export const LayoutGridWidget: Block = {
	slug: 'layoutGridWidget',
	dbName: 'lgw',
	interfaceName: 'LayoutGridWidget',
	labels: { singular: '레이아웃 그리드 위젯', plural: '레이아웃 그리드 위젯' },
	fields: [],
}

export default LayoutGridWidget
