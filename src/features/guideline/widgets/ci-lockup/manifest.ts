import type { ControllerControlDefinition } from '@/modules/studio-controller/controller-definition'
import type { GuidelineControllerManifest } from '../../controllers/contract'
import {
	branchLabel,
	CLEAR_SPACE_MODE_LABEL,
	CLEAR_SPACE_MODES,
	COLOR_TYPE_LABEL,
	COLOR_TYPES,
	MONO_COLORS,
	OVERSEAS_BRANCHES,
	SUBSIDIARIES,
} from './rules'

/*
 * CI 락업이 무엇을 조절할 수 있는지 선언한다. **그리지 않는다** — 그리는 일은 도메인 무지
 * 렌더러(알약)가 하고, 위젯은 Canvas만 남는다(`docs/11` §4.1).
 *
 * 🔴 react·에셋을 import하지 않는다 — `schema.ts`가 이 파일을 읽고 `payload.config`는 Node에서
 *    로드된다. `rules.ts`도 같은 이유로 순수 모듈이다(그 파일 머리 주석).
 * 🔑 선택지는 `rules.ts`에서 파생한다. 계열사가 늘면 매니페스트가 저절로 따라오고, 라벨이 두 곳으로
 *    갈라지지 않는다.
 * 🔴 `id`는 위젯이 값을 집는 키다(`controllerString(values, 'form', …)`). 바꾸면 화면이 조용히
 *    기본값으로 돌아간다 — 매니페스트와 위젯이 id로 묶인 것이 현재 계약의 천장이다.
 */

/**
 * 심볼 높이(px). 🔑 락업의 **모든 치수가 이 값의 배수**라 이 하나가 판형을 정한다.
 * 🔴 하한 60·상한 240은 **판이 읽히는 범위**일 뿐이고 도판이 그 안에서 항상 맞는다는 뜻이 아니다.
 *    도판 라벨은 고정 크기 글자라 H를 따라오지 않아 좁은 트랙에서 겹치고(가장 넓은 해외지사
 *    가로형A는 11.6H라 H≥76에서 이미 판을 넘어 가로 스크롤에 든다), 넘치면 캔버스가 스크롤된다.
 *    그 한계는 `docs/11` §7에 결함으로 적어 두었다.
 * 🔴 규정 최소 크기(디지털 16px)는 **사용 하한**이고 설명 판의 하한이 아니다 — 판 밑 readout이 글로 말한다.
 */
export const HEIGHT = {
	id: 'h',
	kind: 'range',
	label: 'H',
	defaultValue: 100,
	min: 60,
	max: 240,
	step: 10,
	display: { unit: 'px' },
} as const satisfies ControllerControlDefinition

/** 🔑 꼴은 계층에 따라 실제로 열리는 것이 다르다(본사는 `horizontal`, 계열사는 A/B). 매니페스트는
 *  정적이므로 **합집합**을 싣고, 그 계층에 없는 값이 골라지면 렌더가 첫 항목으로 떨어뜨린다
 *  (`rules.ts`의 `lockupOptions`). 알약에서 계층별로 좁히려면 admin이 `optionValues`로 줄인다. */
export const FORM = {
	id: 'form',
	kind: 'select',
	label: '꼴',
	defaultValue: 'horizontal',
	options: [
		{ value: 'horizontal', label: '가로형' },
		{ value: 'horizontalA', label: '가로형A' },
		{ value: 'horizontalB', label: '가로형B' },
		{ value: 'vertical', label: '세로형' },
	],
} as const satisfies ControllerControlDefinition

export const LANGUAGE = {
	id: 'language',
	kind: 'select',
	label: '언어',
	defaultValue: 'ko',
	options: [
		{ value: 'ko', label: '국문' },
		{ value: 'en', label: '영문' },
		{ value: 'hd', label: 'HD' },
	],
} as const satisfies ControllerControlDefinition

/** 🔑 「본사」는 고르는 항목이 아니라 아무것도 켜지 않은 상태다 — 켜기 두 개가 계층을 만든다. */
export const SUBSIDIARY_ON = {
	id: 'subsidiaryOn',
	kind: 'toggle',
	label: '자회사',
	defaultValue: false,
} as const satisfies ControllerControlDefinition

export const SUBSIDIARY = {
	id: 'subsidiary',
	kind: 'select',
	label: '자회사명',
	defaultValue: SUBSIDIARIES[0].ko,
	options: SUBSIDIARIES.map((sub) => ({ value: sub.ko, label: `HD${sub.ko}` })),
} as const satisfies ControllerControlDefinition

export const BRANCH_ON = {
	id: 'branchOn',
	kind: 'toggle',
	label: '해외지사',
	defaultValue: false,
} as const satisfies ControllerControlDefinition

export const BRANCH = {
	id: 'branch',
	kind: 'select',
	label: '지사명',
	defaultValue: branchLabel(OVERSEAS_BRANCHES[0]),
	options: OVERSEAS_BRANCHES.map((branch) => ({
		value: branchLabel(branch),
		label: branchLabel(branch),
	})),
} as const satisfies ControllerControlDefinition

export const COLOR_TYPE = {
	id: 'colorType',
	kind: 'select',
	label: '색상 표현',
	defaultValue: COLOR_TYPES[0],
	options: COLOR_TYPES.map((type) => ({ value: type, label: COLOR_TYPE_LABEL[type] })),
} as const satisfies ControllerControlDefinition

/** 🔴 색을 `color` kind로 두지 않는다 — 단색 색상은 hex가 아니라 **브랜드 색 이름**이고, 값은
 *  `brand-colors`에서 이름으로 찾는다. hex를 값으로 받으면 그 출처가 끊긴다. */
export const MONO = {
	id: 'mono',
	kind: 'select',
	label: '단색 색상',
	defaultValue: MONO_COLORS[0],
	options: MONO_COLORS.map((color) => ({ value: color, label: color })),
} as const satisfies ControllerControlDefinition

export const CLEAR_SPACE = {
	id: 'clearSpace',
	kind: 'select',
	label: '클리어스페이스',
	defaultValue: CLEAR_SPACE_MODES[0],
	options: CLEAR_SPACE_MODES.map((mode) => ({
		value: mode,
		label: CLEAR_SPACE_MODE_LABEL[mode],
	})),
} as const satisfies ControllerControlDefinition

export const MEASURED = {
	id: 'measured',
	kind: 'toggle',
	label: '치수',
	defaultValue: false,
} as const satisfies ControllerControlDefinition

/** 알약의 구분선이 곧 그룹 경계다 — 계층 ┃ 형태 ┃ 색 ┃ 표시. */
export const CI_LOCKUP_MANIFEST = {
	id: 'ci-lockup',
	groups: [
		{ id: 'tier', title: '계층', controls: [SUBSIDIARY_ON, SUBSIDIARY, BRANCH_ON, BRANCH] },
		{ id: 'shape', title: '형태', controls: [FORM, LANGUAGE] },
		{ id: 'color', title: '색', controls: [COLOR_TYPE, MONO] },
		{ id: 'display', title: '표시', controls: [CLEAR_SPACE, MEASURED] },
		{ id: 'size', title: '크기', controls: [HEIGHT] },
	],
} as const satisfies GuidelineControllerManifest

/* 🔑 허용 값 목록은 **매니페스트에서 파생한다** — Canvas가 알약이 줄 수 있는 값만 받아들이도록,
   같은 목록을 두 곳에 적지 않는다(`controllerString`의 세 번째 인자). */
export const FORM_VALUES = FORM.options.map((option) => option.value)
export const LANGUAGE_VALUES = LANGUAGE.options.map((option) => option.value)
export const SUBSIDIARY_VALUES = SUBSIDIARY.options.map((option) => option.value)
export const BRANCH_VALUES = BRANCH.options.map((option) => option.value)

/**
 * 축 전체의 순서 있는 목록. 🔑 **schema·registry·알약이 같은 목록을 읽는다** — 축이 늘면
 * admin 필드와 제한 변환이 저절로 따라온다. 축마다 필요한 것은 둘이다(사용자 지정 2026-08-19):
 * ① 페이지를 처음 열었을 때의 상태 ② 그 축을 알약에 낼지.
 */
export const CI_LOCKUP_CONTROLS = [
	HEIGHT,
	SUBSIDIARY_ON,
	SUBSIDIARY,
	BRANCH_ON,
	BRANCH,
	FORM,
	LANGUAGE,
	COLOR_TYPE,
	MONO,
	CLEAR_SPACE,
	MEASURED,
] as const

/** admin이 알약에서 뺄 수 있는 컨트롤 목록. */
export const CI_LOCKUP_CONTROL_IDS = CI_LOCKUP_CONTROLS.map((control) => ({
	value: control.id,
	label: control.label,
}))
