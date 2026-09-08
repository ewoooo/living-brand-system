import type { Block } from 'payload'

// 레이아웃 그리드 오버레이 위젯 — Block children에 등록되는 인터랙티브 leaf. 인스턴스 입력 없이 자족 렌더(fields=[]).
// dbName 짧게(lgo)로 중첩 테이블명 63자 방어.
export const LayoutGridOverlayWidget: Block = {
	slug: 'layoutGridOverlayWidget',
	dbName: 'lgo',
	interfaceName: 'LayoutGridOverlayWidget',
	labels: { singular: '레이아웃 그리드 오버레이 위젯', plural: '레이아웃 그리드 오버레이 위젯' },
	fields: [],
}

export default LayoutGridOverlayWidget
