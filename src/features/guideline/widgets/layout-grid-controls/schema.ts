import type { Block } from 'payload'
import { GUTTER_RATIO, MARGIN_PCT } from '../layout-grid/rules'

// 레이아웃 그리드 컨트롤 위젯 — 같은 페이지의 layoutGridWidget 전부의 값을 소유한다.
//
// 🔑 값 4개 + "조절 허용" 4개로 페이지별 템플릿을 만든다:
//    조절 허용 → 뷰어에게 슬라이더를 주고 여기 값은 초기값이 된다.
//    조절 불허 → 슬라이더를 주지 않으므로 여기 값이 평생 고정값이 된다.
//    (예: 수직 거터만 허용 = 수평 거터를 못 만지는 템플릿 / 마진만 허용 등)
// 전부 불허면 패널이 아무것도 렌더하지 않지만, 고정값을 심는 역할로 여전히 배치해야 한다.
//
// 🔴 min·max는 정본 규칙(../layout-grid/rules)에서 가져온다 — admin 입력과 슬라이더가 같은 범위를 쓴다.
// dbName 짧게(lgc)로 중첩 테이블명 63자 방어.
export const LayoutGridControlsWidget: Block = {
	slug: 'layoutGridControlsWidget',
	dbName: 'lgc',
	interfaceName: 'LayoutGridControlsWidget',
	labels: { singular: '레이아웃 그리드 컨트롤 위젯', plural: '레이아웃 그리드 컨트롤 위젯' },
	fields: [
		{
			name: 'marginPct',
			type: 'number',
			defaultValue: MARGIN_PCT.default,
			min: MARGIN_PCT.min,
			max: MARGIN_PCT.max,
			admin: { description: `마진(판형 긴 축의 %). ${MARGIN_PCT.min}~${MARGIN_PCT.max}.` },
		},
		{
			name: 'marginAdjustable',
			type: 'checkbox',
			defaultValue: true,
			admin: {
				description: '뷰어가 마진을 조절할 수 있게 합니다. 끄면 위 값으로 고정됩니다.',
			},
		},
		{
			name: 'gutterX',
			type: 'number',
			defaultValue: GUTTER_RATIO.default,
			min: GUTTER_RATIO.min,
			max: GUTTER_RATIO.max,
			admin: { description: `수평 거터(마진의 %). ${GUTTER_RATIO.min}~${GUTTER_RATIO.max}.` },
		},
		{
			name: 'gutterXAdjustable',
			type: 'checkbox',
			defaultValue: true,
			admin: { description: '뷰어가 수평 거터를 조절할 수 있게 합니다.' },
		},
		{
			name: 'gutterY',
			type: 'number',
			defaultValue: GUTTER_RATIO.default,
			min: GUTTER_RATIO.min,
			max: GUTTER_RATIO.max,
			admin: { description: `수직 거터(마진의 %). ${GUTTER_RATIO.min}~${GUTTER_RATIO.max}.` },
		},
		{
			name: 'gutterYAdjustable',
			type: 'checkbox',
			defaultValue: true,
			admin: { description: '뷰어가 수직 거터를 조절할 수 있게 합니다.' },
		},
		{
			name: 'guidesOn',
			type: 'checkbox',
			defaultValue: true,
			admin: { description: '그리드(마진·거터 영역과 분할선)를 처음부터 보여줍니다.' },
		},
		{
			name: 'guidesAdjustable',
			type: 'checkbox',
			defaultValue: true,
			admin: { description: '뷰어가 그리드를 켜고 끌 수 있게 합니다.' },
		},
	],
}

export default LayoutGridControlsWidget
