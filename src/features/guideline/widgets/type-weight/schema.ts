import type { Block } from 'payload'
import { LANGUAGES, WEIGHTS } from '../brand-typeface'

// 서체 굵기 컨트롤 — 문구 하나를 두고 굵기만 갈아 끼워 3종을 몸으로 비교하게 한다.
//
// 🔴 언어 전환은 넣지 않는다. 언어는 저작 시점에 고르는 값이고, 언어를 바꿔가며 보는 것(행간 규정 비교)은
//    다른 위젯의 몫이다. 여기서 런타임에 바뀌는 값은 굵기 하나뿐이어야 비교가 성립한다.
//
// 🔴 옵션 라벨을 여기서 새로 쓰지 않고 brand-typeface에서 가져온다 — 서체가 교체되면 상수 한 곳만 바뀐다.
//    (brand-typeface는 순수 상수 모듈이라 payload.config가 Node에서 로드해도 안전하다.)
//
// dbName 짧게(twt), enum은 전역 이름 공유라 enumName 명시 — 조회 SQL 별칭 63자 한계 방어.
export const TypeWeightWidget: Block = {
	slug: 'typeWeightWidget',
	dbName: 'twt',
	interfaceName: 'TypeWeightWidget',
	labels: { singular: '서체 굵기 컨트롤', plural: '서체 굵기 컨트롤' },
	fields: [
		{
			name: 'language',
			type: 'select',
			defaultValue: 'ko',
			enumName: 'enum_twt_language',
			options: LANGUAGES.map(({ key, label }) => ({ label, value: key })),
			admin: {
				description:
					'표본 문구의 언어입니다. 문구와 행간은 그 언어의 규정을 따라 고정되고, 화면에서는 굵기만 바뀝니다.',
			},
		},
		{
			name: 'initialWeight',
			type: 'select',
			defaultValue: 'medium',
			enumName: 'enum_twt_weight',
			options: WEIGHTS.map(({ key, label, value }) => ({
				label: `${label} (${value})`,
				value: key,
			})),
			admin: {
				description:
					'처음 보여줄 굵기입니다. 보는 사람이 컨트롤로 3단 사이를 옮겨 다닐 수 있습니다.',
			},
		},
	],
}

export default TypeWeightWidget
