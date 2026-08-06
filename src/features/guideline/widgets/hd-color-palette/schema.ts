import type { Block } from 'payload'

// HD현대 컬러 팔레트 위젯. brand-color-groups를 서버에서 조회해 색을 한 줄로 늘어놓는다.
// 어떤 색이 어느 그룹에 어떤 순서로 들어가는지는 컬렉션이 소유한다 — 위젯은 어느 그룹을 그릴지만 고른다.
// 제목·폭은 컨테이너 Block 소관이라 여기 없다(docs/11 §4). rules도 Block에만 둔다(provenance 불변식).
export const HdColorPaletteWidget: Block = {
	slug: 'hdColorPaletteWidget',
	dbName: 'hcp',
	interfaceName: 'HdColorPaletteWidget',
	labels: { singular: 'HD 컬러 팔레트 위젯', plural: 'HD 컬러 팔레트 위젯' },
	fields: [
		{
			// hasMany인 이유: 같은 색을 다른 기준으로 묶은 그룹이 공존한다(용도별 / 계열별).
			// 한 블록이 그중 어느 묶음을 보여줄지 골라야 하므로 단일 선택으로는 부족하다.
			name: 'groups',
			type: 'relationship',
			relationTo: 'brand-color-groups',
			hasMany: true,
			admin: {
				description:
					'표시할 컬러 그룹입니다. 고른 순서대로 한 행씩 그립니다. 비우면 모든 그룹을 표시합니다.',
			},
		},
	],
}

export default HdColorPaletteWidget
