import type { Block } from 'payload'

// 여백 규정 위젯 — Block children에 등록되는 인터랙티브 leaf. 인스턴스 입력 없이 자족 렌더(fields=[]).
// dbName 짧게(scs)로 중첩 테이블명 63자 방어.
export const StemClearSpaceWidget: Block = {
	slug: 'stemClearSpaceWidget',
	dbName: 'scs',
	interfaceName: 'StemClearSpaceWidget',
	labels: { singular: '여백 규정 위젯', plural: '여백 규정 위젯' },
	fields: [],
}

export default StemClearSpaceWidget
