import type { Block } from 'payload'

// HD현대 컬러 팔레트 위젯. brand-color-groups를 서버에서 조회해 그룹당 한 행씩 스와치를 그린다.
// author 입력 필드가 없다 — 어떤 색이 어느 그룹에 어떤 순서로 들어가는지는 컬렉션이 소유하므로
// 위젯이 고를 것이 남지 않는다(color-palette 위젯과 같은 자족 조회 패턴).
// rules 없음: 컨테이너 Block이 소유한다(provenance 불변식).
export const HdColorPaletteWidget: Block = {
	slug: 'hdColorPaletteWidget',
	dbName: 'hcp',
	interfaceName: 'HdColorPaletteWidget',
	labels: { singular: 'HD 컬러 팔레트 위젯', plural: 'HD 컬러 팔레트 위젯' },
	fields: [],
}

export default HdColorPaletteWidget
