import type { Block } from 'payload'
import { IMAGE_RATIO_OPTIONS } from '@/types/image-ratio'

// Do/Don't 위젯 — legacy `doDont` 블록의 widget판. 예시(이미지+캡션) 그리드를 렌더하는 leaf.
// legacy와 다른 점: 세트 단위 헤딩(category/description)이 없다 = groups 계층 없이 examples 평면.
//   → kind(권장/허용/금지)는 그룹이 아니라 예시마다 붙는다.
// 프레임·배경·제목은 Block 소관이라 위젯에 두지 않는다(baseBlockFields 미포함 = rules는 Block에만).
// dbName 짧게(ddw)로 중첩 테이블명 63자 방어. enum은 전역 이름 공유라 enumName 명시.
export const DoDontWidget: Block = {
	slug: 'doDontWidget',
	dbName: 'ddw',
	interfaceName: 'DoDontWidget',
	labels: { singular: 'Do/Don’t 위젯', plural: 'Do/Don’t 위젯' },
	fields: [
		{
			type: 'row',
			fields: [
				{
					name: 'imageRatio',
					type: 'select',
					defaultValue: '4:3',
					enumName: 'enum_guideline_docs_blocks_do_dont_image_ratio',
					options: [...IMAGE_RATIO_OPTIONS],
					admin: { width: '50%', description: '예시 이미지의 표시 비율입니다.' },
				},
				{
					name: 'columns',
					type: 'select',
					defaultValue: '3',
					enumName: 'enum_guideline_docs_blocks_do_dont_example_columns',
					options: [
						{ label: '2열', value: '2' },
						{ label: '3열', value: '3' },
						{ label: '4열', value: '4' },
					],
					admin: {
						width: '50%',
						description: '넓은 화면에서 예시를 배치할 열 수입니다.',
					},
				},
			],
		},
		{
			name: 'examples',
			type: 'array',
			minRows: 1,
			admin: { description: '예시 이미지와 캡션입니다. 세트 헤딩은 없습니다.' },
			fields: [
				{
					type: 'row',
					fields: [
						{
							name: 'image',
							type: 'upload',
							relationTo: 'application-images',
							admin: { width: '50%' },
						},
						{
							name: 'kind',
							type: 'select',
							required: true,
							defaultValue: 'dont',
							enumName: 'enum_guideline_docs_blocks_do_dont_groups_kind',
							options: [
								{ label: 'Do (권장)', value: 'do' },
								{ label: 'OK (허용)', value: 'ok' },
								{ label: "Don't (금지)", value: 'dont' },
							],
							admin: { width: '50%' },
						},
					],
				},
				{ name: 'caption', type: 'text', localized: true },
			],
		},
	],
}

export default DoDontWidget
