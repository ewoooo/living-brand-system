import type { Block } from 'payload'

// 타입 스페시멘 위젯 — Block children에 등록되는 인터랙티브 leaf. 인스턴스 입력 없이 자족 렌더(fields=[]).
// dbName 짧게(tsp)로 중첩 테이블명 63자 방어.
export const TypeSpecimenWidget: Block = {
	slug: 'typeSpecimenWidget',
	dbName: 'tsp',
	interfaceName: 'TypeSpecimenWidget',
	labels: { singular: '타입 스페시멘 위젯', plural: '타입 스페시멘 위젯' },
	fields: [],
}

export default TypeSpecimenWidget
