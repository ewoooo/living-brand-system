import type { Block } from 'payload'

// 컬러 페어링 위젯 — Block children에 등록되는 인터랙티브 leaf. 인스턴스 입력 없이 자족 렌더(fields=[]).
// dbName 짧게(cpr)로 중첩 테이블명 63자 방어.
export const ColorPairingWidget: Block = {
	slug: 'colorPairingWidget',
	dbName: 'cpr',
	interfaceName: 'ColorPairingWidget',
	labels: { singular: '컬러 페어링 위젯', plural: '컬러 페어링 위젯' },
	fields: [],
}

export default ColorPairingWidget
