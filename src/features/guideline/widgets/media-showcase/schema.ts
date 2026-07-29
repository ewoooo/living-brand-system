import type { Block } from 'payload'

// 미디어 쇼케이스 위젯 — Block children에 등록되는 인터랙티브 leaf. 인스턴스 입력 없이 자족 렌더(fields=[]).
// dbName 짧게(msw)로 중첩 테이블명 63자 방어.
export const MediaShowcaseWidget: Block = {
	slug: 'mediaShowcaseWidget',
	dbName: 'msw',
	interfaceName: 'MediaShowcaseWidget',
	labels: { singular: '미디어 쇼케이스 위젯', plural: '미디어 쇼케이스 위젯' },
	fields: [],
}

export default MediaShowcaseWidget
