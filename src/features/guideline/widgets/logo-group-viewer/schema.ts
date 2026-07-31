import type { Block } from 'payload'

// 로고 그룹 뷰어 위젯 — Block children에 등록되는 인터랙티브 leaf. 인스턴스 입력 없이 자족 렌더(fields=[]).
// dbName 짧게(lgv)로 중첩 테이블명 63자 방어.
export const LogoGroupViewerWidget: Block = {
	slug: 'logoGroupViewerWidget',
	dbName: 'lgv',
	interfaceName: 'LogoGroupViewerWidget',
	labels: { singular: '로고 그룹 뷰어 위젯', plural: '로고 그룹 뷰어 위젯' },
	fields: [],
}

export default LogoGroupViewerWidget
