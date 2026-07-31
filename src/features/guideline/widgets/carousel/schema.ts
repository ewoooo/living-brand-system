import type { Block } from 'payload'

// 캐러셀 위젯 — Block children에 등록되는 인터랙티브 leaf. 인스턴스 입력 없이 자족 렌더(fields=[]).
// dbName 짧게(car)로 중첩 테이블명 63자 방어.
export const CarouselWidget: Block = {
	slug: 'carouselWidget',
	dbName: 'car',
	interfaceName: 'CarouselWidget',
	labels: { singular: '캐러셀 위젯', plural: '캐러셀 위젯' },
	fields: [],
}

export default CarouselWidget
