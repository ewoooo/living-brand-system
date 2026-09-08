import type { Field } from 'payload'
import { CARD_RATIO_OPTIONS } from './displays/ratio'
import { displayBlocks } from './displays/registry'

/**
 * 카드 = 디스플레이 + 캡션(제목·설명). 콘텐츠의 최소 단위이고 블록의 하위 개체다(2026-09-07 모델).
 *
 * 🔴 비율은 규격 타입에서 고른다(`displays/ratio.ts`). 디스플레이는 정적(이미지) 또는 다이나믹(위젯)
 *    중 **하나**다. 캡션은 선택이고 제목·설명도 각각 단독으로 쓸 수 있다 — 빈 자리는 렌더하지 않는다.
 * 🔴 카드는 폭을 갖지 않는다. 줄 높이는 블록이 정하고(`rowHeight`) 폭은 비율에서 계산된다 — 그래서
 *    카드가 정하는 값은 비율 하나다.
 */
export function cardFields(): Field[] {
	return [
		{
			name: 'ratio',
			type: 'select',
			required: true,
			defaultValue: '16:9',
			enumName: 'enum_card_ratio',
			options: [...CARD_RATIO_OPTIONS],
			admin: {
				description:
					'카드 판의 비율입니다. 높이는 블록의 줄 높이를 따르고 폭이 여기서 나옵니다.',
			},
		},
		{
			name: 'display',
			type: 'blocks',
			label: '디스플레이',
			maxRows: 1,
			blocks: displayBlocks,
			admin: { description: '판에 무엇을 그릴지입니다. 이미지 하나 또는 위젯 하나.' },
		},
		{
			name: 'caption',
			type: 'group',
			label: '캡션',
			fields: [
				{
					name: 'placement',
					type: 'select',
					label: '캡션 배치',
					defaultValue: 'below',
					enumName: 'enum_card_caption_placement',
					options: [
						{ label: '카드 아래', value: 'below' },
						{ label: '이미지 위 하단', value: 'overlay' },
					],
				},
				{ name: 'title', type: 'text', localized: true },
				{
					name: 'description',
					type: 'richText',
					localized: true,
					admin: {
						description: '텍스트 또는 표. 2열 표는 라벨·값 스펙 리스트로 그립니다.',
					},
				},
			],
		},
	]
}

/** 블록이 품는 카드 목록. */
export function cardsField(): Field {
	return {
		name: 'cards',
		type: 'array',
		label: '카드',
		fields: cardFields(),
		admin: { description: '이 블록이 품는 카드입니다. 배치는 블록의 레이아웃이 정합니다.' },
	}
}
