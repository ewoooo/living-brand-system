import type { Block } from 'payload'
import { APPLICATION_TYPE_OPTIONS } from './rules'

// 분리형 로고 적용 위젯 — PDF p14 'CI 단색 분리형'. 좌: 분리형 배리언트 목록 / 우: 실사 적용 카드.
// 🔑 p14 우측 '특수 효과' 셀은 원본이 미완성이다("후가공 예시 추가 예정") — 이미지가 없는 카드가
//    자리표시자로 성립하는 게 정상 상태다. 그래서 placeholder boolean 없이 image 유무로만 판정한다.
// 🔴 치수 필드가 없다. p14에 분리형 수치 규정이 없고(최소 여백·최소 크기 규정을 '참조'하라는 지시뿐),
//    "Gap"도 심볼–워드마크 간격이 아니라 단색 아트워크 안의 간격이다(rules.ts 참조).
// 🔴 본문 산문 필드가 없다 — p14 3단락은 Block의 description 소유다(docs/11 §4).
// 열 수·이미지 비율은 Block 소관이라 두지 않는다. rules도 Block에만 둔다(provenance 불변식).
// dbName 짧게(sla)로 중첩 테이블명 63자 방어. enum은 전역 이름 공유라 enumName 명시.
// 🔴 slug도 짧아야 한다. Payload가 조회 SQL에서 만드는 별칭은 dbName이 아니라 **slug**로 짜인다:
//    `guideline_docs__blocks_<slug>_<배열필드>__locales`. 이게 63자를 넘으면 Postgres가 잘라
//    배열 별칭과 그 locales 별칭이 같은 이름이 되고, 조인이 엉뚱한 테이블을 물어
//    "operator does not exist: character varying = integer"로 죽는다(실제로 밟았다).
//    그래서 slug=sepLogoAppWidget(16), 배열은 apps(4)·variants(8)로 줄였다. alias-length.test.ts가 지킨다.
export const SeparatedLogoApplicationWidget: Block = {
	slug: 'sepLogoAppWidget',
	dbName: 'sla',
	interfaceName: 'SeparatedLogoApplicationWidget',
	labels: { singular: '분리형 로고 적용 위젯', plural: '분리형 로고 적용 위젯' },
	fields: [
		{
			name: 'variants',
			type: 'array',
			admin: { description: '단색 분리형 배리언트입니다.' },
			fields: [
				{
					type: 'row',
					fields: [
						{
							name: 'logo',
							type: 'upload',
							relationTo: 'brand-logos',
							admin: { width: '50%' },
						},
						{
							name: 'label',
							type: 'text',
							localized: true,
							admin: { width: '50%', description: '예: CI 국문 - 가로형' },
						},
					],
				},
			],
		},
		{
			// 🔴 `applications`가 아니라 `apps` — 위 63자 별칭 한계 때문이다.
			name: 'apps',
			type: 'array',
			admin: {
				description:
					'실사 적용 예시입니다. 이미지가 없으면 안내 문구를 넣은 자리표시자로 표시됩니다.',
			},
			fields: [
				{
					type: 'row',
					fields: [
						{
							name: 'type',
							type: 'select',
							required: true,
							defaultValue: 'sign',
							enumName: 'enum_sla_type',
							options: APPLICATION_TYPE_OPTIONS,
							admin: { width: '50%' },
						},
						{
							name: 'image',
							type: 'upload',
							relationTo: 'application-images',
							admin: { width: '50%' },
						},
					],
				},
				{ name: 'caption', type: 'text', localized: true },
				{
					name: 'note',
					type: 'text',
					localized: true,
					admin: {
						description:
							'이미지가 아직 없을 때 자리표시자에 표시할 문구입니다(예: 후가공 예시 추가 예정).',
					},
				},
			],
		},
	],
}

export default SeparatedLogoApplicationWidget
