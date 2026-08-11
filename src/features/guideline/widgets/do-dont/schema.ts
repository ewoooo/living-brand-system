import type { Block } from 'payload'
import { IMAGE_RATIO_OPTIONS } from '@/types/image-ratio'
import { PRESET_OPTIONS } from './presets'

// Do/Don't 위젯 — 리포에 하나뿐인 do/dont 위젯이다. 나쁜예시(또는 권장예시) 그리드를 렌더하는 leaf.
//
// 한 예시의 그림은 둘 중 하나다:
//   image  — 업로드한 예시 이미지 (CI 금지 12종처럼 형태 변형은 이미지라야 보인다)
//   preset — 코드 프리셋 컬러 패널 (컬러 금지 6종처럼 위반이 색 자체라 이미지가 필요 없다)
// 둘 다 없으면 그 예시는 캡션만 남는다.
//
// 프레임·배경·제목·rules는 Block 소관이라 위젯에 두지 않는다(rules는 Block에만 = provenance 불변식).
// legacy `doDont` 블록은 2026-08-10에 1세대 저작 모델과 함께 삭제됐다. Do/Don't는 이 위젯 하나뿐이다.
//
// dbName 짧게(ddw)로 중첩 테이블명 63자 방어. enum은 전역 이름 공유라 enumName 명시.
// 🔴 enum 이름은 위젯이 소유한다(enum_ddw_*). 처음에는 레거시 do-dont 블록의 enum을 그대로
//    재사용했는데, 그러면 블록을 지울 때 살아 있는 위젯 컬럼의 타입이 함께 사라진다.
//    2026-08-10에 ALTER TYPE RENAME으로 떼어냈다 — 다시 남의 enum 이름을 가리키지 말 것.
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
					defaultValue: '16:9',
					enumName: 'enum_ddw_image_ratio',
					options: [...IMAGE_RATIO_OPTIONS],
					admin: { width: '50%', description: '예시 판형의 표시 비율입니다.' },
				},
				{
					name: 'columns',
					type: 'select',
					defaultValue: '3',
					enumName: 'enum_ddw_example_columns',
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
			name: 'itemLabel',
			type: 'text',
			defaultValue: 'INCORRECT USAGE',
			admin: {
				description:
					'예시마다 붙는 제목입니다. 뒤에 순번이 자동으로 붙습니다(INCORRECT USAGE 1, 2 …). 비우면 제목 없이 그림만 나옵니다.',
			},
		},
		{
			// 컬러 패널 프리셋은 로고를 얹어 그린다. 이미지 예시만 쓰면 필요 없다.
			name: 'logo',
			type: 'upload',
			relationTo: 'brand-logos',
			admin: {
				description:
					'컬러 패널 프리셋에 올릴 기준 로고입니다. 같은 언어·방향의 기본형/WHITE/단색형을 파일명 규약으로 함께 찾습니다.',
			},
		},
		{
			name: 'examples',
			type: 'array',
			minRows: 1,
			admin: { description: '예시입니다. 세트 헤딩은 없습니다.' },
			fields: [
				{
					type: 'row',
					fields: [
						{
							name: 'image',
							type: 'upload',
							relationTo: 'application-images',
							admin: { width: '50%', description: '예시 이미지입니다.' },
						},
						{
							name: 'kind',
							type: 'select',
							required: true,
							defaultValue: 'dont',
							enumName: 'enum_ddw_examples_kind',
							options: [
								{ label: 'Do (권장)', value: 'do' },
								{ label: 'OK (허용)', value: 'ok' },
								{ label: "Don't (금지)", value: 'dont' },
							],
							admin: { width: '50%' },
						},
					],
				},
				{
					name: 'preset',
					type: 'select',
					enumName: 'enum_ddw_examples_preset',
					options: [...PRESET_OPTIONS],
					admin: {
						description:
							'이미지 대신 쓸 컬러 패널입니다. 색·그라디언트·투명도 중첩처럼 이미지로 만들면 원본 값이 사라지는 예시에 씁니다. 이미지를 함께 지정하면 이미지가 이깁니다.',
					},
				},
				{ name: 'caption', type: 'text', localized: true },
			],
		},
	],
}

export default DoDontWidget
