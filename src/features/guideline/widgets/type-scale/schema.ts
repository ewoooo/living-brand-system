import type { Block } from 'payload'

// 타입 스케일 위젯 — Block children에 등록되는 인터랙티브 leaf. 인스턴스 입력 없이 자족 렌더(fields=[]).
// dbName 짧게(tsc)로 중첩 테이블명 63자 방어.
export const TypeScaleWidget: Block = {
	slug: 'typeScaleWidget',
	dbName: 'tsc',
	interfaceName: 'TypeScaleWidget',
	labels: { singular: '타입 스케일 위젯', plural: '타입 스케일 위젯' },
	fields: [],
}

export default TypeScaleWidget
