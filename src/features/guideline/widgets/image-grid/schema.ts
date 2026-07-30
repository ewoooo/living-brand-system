import type { Block } from 'payload'

// 이미지 그리드 위젯 — Block children에 등록되는 인터랙티브 leaf. 인스턴스 입력 없이 자족 렌더(fields=[]).
// dbName 짧게(imw)로 중첩 테이블명 63자 방어.
export const ImageGridWidget: Block = {
	slug: 'imageGridWidget',
	dbName: 'imw',
	interfaceName: 'ImageGridWidget',
	labels: { singular: '이미지 그리드 위젯', plural: '이미지 그리드 위젯' },
	fields: [],
}

export default ImageGridWidget
