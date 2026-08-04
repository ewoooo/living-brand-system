import type { Block } from 'payload'

// 레이아웃 그리드 컨트롤 위젯 — 같은 페이지의 layoutGridWidget 전부를 한 패널로 통제한다.
// 인스턴스 입력 없이 자족 렌더(fields=[]). 판형들 다음에 오도록 children 마지막에 둔다.
// dbName 짧게(lgc)로 중첩 테이블명 63자 방어.
export const LayoutGridControlsWidget: Block = {
	slug: 'layoutGridControlsWidget',
	dbName: 'lgc',
	interfaceName: 'LayoutGridControlsWidget',
	labels: { singular: '레이아웃 그리드 컨트롤 위젯', plural: '레이아웃 그리드 컨트롤 위젯' },
	fields: [],
}

export default LayoutGridControlsWidget
