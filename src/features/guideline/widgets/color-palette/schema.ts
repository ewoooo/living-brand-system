import type { Block } from 'payload'

// ⚠️ SPIKE (임시) — block-widget-separation 검증용. 제거 시 이 폴더(widgets/color-palette) 통째 삭제.
//
// color-palette를 "위젯"으로 만든 것. 원본 블록(colorPalette, author가 색 선택)과 달리
// 위젯은 **brand-colors 전체를 서버에서 자동 조회**해 전체 팔레트를 보여준다(colorPairing과 동일 패턴).
// = Widget은 브랜드 데이터로 스스로 조립되는 동적 이미지, 읽기 전용. author 입력 필드 없음.
// - title·rules 없음: 텍스트는 나중, rules는 컨테이너 Block 소유(provenance 불변식).
// - widgets/ 아래라 자동 카탈로그(top-level)에 미등록. 컨테이너 block-spike가 참조.
export const ColorPaletteWidget: Block = {
	slug: 'colorPaletteWidget',
	dbName: 'cpw',
	interfaceName: 'ColorPaletteWidget',
	labels: { singular: '컬러 팔레트 위젯', plural: '컬러 팔레트 위젯' },
	fields: [],
}

export default ColorPaletteWidget
