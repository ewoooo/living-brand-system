import type {
	ControllerControlRestriction,
	StudioControllerRestrictions,
} from '@/modules/studio-controller/controller-definition'
import {
	CI_LOCKUP_CONTROLS,
	CI_LOCKUP_MANIFEST,
	ciLockupHiddenAxes,
} from '../widgets/ci-lockup/manifest'
import { lockupOptions, tierFor } from '../widgets/ci-lockup/rules'
import { CLEARSPACE_VIEWER_MANIFEST } from '../widgets/clearspace-viewer/manifest'
import { LAYOUT_GRID_MANIFEST } from '../widgets/layout-grid/manifest'
import type { GuidelineControllerManifest } from './contract'

/**
 * 어떤 자식 블록이 컨트롤러를 여는가 — **블록 렌더러가 아는 유일한 통로**.
 *
 * 🔑 블록 렌더러는 `'layoutGridControlsWidget'`이라는 이름을 몰라야 하고, 위젯은 컨트롤러 기계를
 *    몰라야 한다. 그 둘을 아는 자리가 여기 하나뿐이다. 다른 위젯이 컨트롤러를 열게 되면
 *    이 표에 줄 하나를 더한다.
 *
 * 🔴 방향은 **공용 → 위젯**이다. registry가 위젯의 매니페스트를 import하지, 위젯이 registry를
 *    부르지 않는다. 반대로 하면 위젯이 컨트롤러 기계에 묶인다.
 */
type ControllerEntry = {
	manifest: GuidelineControllerManifest
	/** admin이 위젯에 넣은 값을 **좁히기만 하는** 제한으로 옮긴다. */
	toRestrictions: (fields: Record<string, unknown>) => StudioControllerRestrictions
	/**
	 * 이 자식이 **컨트롤만 나르는가**. 참이면 배치에서 걷어낸다 — 그릴 것이 없기 때문이다.
	 *
	 * 🔴 기본은 거짓이다. 대부분의 위젯은 **자기 그림을 그리면서** 컨트롤을 선언한다
	 *    (배율·행간처럼 그 그림을 조절하는 값). 그런 위젯을 배치에서 빼면 화면이 빈다.
	 */
	panelOnly?: boolean
}

/**
 * 값 + "조절 허용" 짝을 제한 하나로 접는다.
 * - 값이 있으면 `defaultValue`를 덮는다(초기값 오버라이드).
 * - 조절 불허면 `readonly` — 알약에 싣지 않고 그 값에 머문다(`pill.tsx`).
 *
 * 🔴 `undefined`와 `false`를 가르는 것이 중요하다. Payload checkbox는 미설정 시 `undefined`로
 *    오고 그때의 기본은 **허용**이다. `?? true`로 접으면 명시적 `false`가 살아남는다.
 */
function foldRestriction(
	controlId: string,
	value: unknown,
	adjustable: unknown,
): ControllerControlRestriction {
	const allowed = (adjustable ?? true) !== false
	return {
		controlId,
		...(typeof value === 'number' || typeof value === 'boolean' ? { defaultValue: value } : {}),
		...(allowed ? {} : { availability: 'readonly' as const }),
	}
}

/**
 * 축마다 **초기값 + 제공 여부**를 제한 하나로 접는다(사용자 지정 2026-08-19).
 * - admin이 넣은 값이 `defaultValue`를 덮는다 → 페이지를 처음 열었을 때의 상태.
 * - `hiddenControls`에 담긴 축은 `readonly` → 알약에 싣지 않고 그 값에 머문다(`pill.tsx`).
 *
 * 🔑 그래서 「페이지 제목이 곧 규정」이 된다 — 자회사 토픽에서 해외지사 축을 빼면 그 페이지에서
 *    해외지사 락업이 나올 길이 없다.
 * 🔴 좁히기만 한다. 목록은 매니페스트가 소유하므로 축이 늘면 이 변환도 저절로 따라온다.
 */
function ciLockupRestrictions(fields: Record<string, unknown>): ControllerControlRestriction[] {
	// 🔑 admin이 고른 목록 + 기본 비노출 축(H). 목록은 매니페스트가 소유한다.
	const hidden = ciLockupHiddenAxes({
		hiddenControls: Array.isArray(fields.hiddenControls) ? fields.hiddenControls : null,
		heightControl: fields.heightControl === true,
	})
	// 🔑 계층이 정하는 선택지로 **좁힌다.** 매니페스트는 정적이라 꼴·언어의 합집합을 싣는데, 본사에는
	//    가로형A·B가 없고 자회사에는 HD형이 없다. 좁히지 않으면 알약에 없는 조합이 떠서 고르면
	//    렌더가 조용히 첫 항목으로 떨어진다 — 사용자에게는 「눌렀는데 아무 일도 안 일어난다」다.
	const tier = tierFor(fields.subsidiaryOn === true, fields.branchOn === true)
	const allowed = lockupOptions(tier)
	const narrowing: Record<string, readonly string[]> = {
		form: allowed.forms.map((form) => form.key),
		language: allowed.languages.map((language) => language.key),
	}

	return CI_LOCKUP_CONTROLS.map((control) => {
		const value = fields[control.id]
		const options = narrowing[control.id]
		return {
			controlId: control.id,
			...(options
				? { optionValues: options, defaultValue: withinOptions(control, value, options) }
				: {}),
			...(!options && usable(control, value) ? { defaultValue: value } : {}),
			...(hidden.has(control.id) ? { availability: 'readonly' as const } : {}),
		}
	})
}

/**
 * 좁힌 목록 안의 초기값을 고른다 — admin 값 → 매니페스트 기본값 → 목록 첫 항목.
 *
 * 🔴 목록을 좁히면 초기값도 그 안이어야 한다. 아니면 `applyControllerRestrictions`가
 *    「options에 포함되어야 합니다」로 던져 **페이지가 죽는다**. 매니페스트 기본값이 합집합 기준이라
 *    (본사 `horizontal`) 계층을 올리면 그것부터 목록 밖으로 밀려난다 — 테스트가 그것을 잡았다.
 */
function withinOptions(
	control: (typeof CI_LOCKUP_CONTROLS)[number],
	value: unknown,
	options: readonly string[],
): string {
	if (typeof value === 'string' && options.includes(value)) return value
	const fallback = control.defaultValue
	if (typeof fallback === 'string' && options.includes(fallback)) return fallback
	return options[0]
}

/**
 * admin 값을 초기값으로 쓸 수 있는가.
 *
 * 🔴 **`select` 값이 options에 없으면 버린다.** 그러지 않으면 `applyControllerRestrictions`가 렌더
 *    중에 던져 **페이지가 죽는다**(`controller-definition.ts`: `defaultValue: options에 포함되어야
 *    합니다`). 선택지는 `rules.ts`에서 파생하므로 계열사·지사 목록이 바뀌면 저장된 값이 고아가 되고,
 *    그때 페이지가 죽는 것보다 매니페스트 기본값으로 그려지는 것이 낫다 — 화면은 서고 admin이
 *    다시 고르면 된다.
 */
function usable(
	control: (typeof CI_LOCKUP_CONTROLS)[number],
	value: unknown,
): value is string | number | boolean {
	if (control.kind === 'toggle') return typeof value === 'boolean'
	// 🔴 범위 밖 숫자도 `applyControllerRestrictions`가 던진다 — select와 같은 이유로 버린다.
	if (control.kind === 'range')
		return typeof value === 'number' && value >= control.min && value <= control.max
	if (control.kind === 'select')
		return typeof value === 'string' && control.options.some((o) => o.value === value)
	return false
}

export const GUIDELINE_CONTROLLERS: Readonly<Record<string, ControllerEntry>> = {
	// 자기 그림을 그리면서 컨트롤도 여는 위젯 — 배치에 남는다(panelOnly 아님).
	// admin이 좁힐 값이 없어 제한은 비운다.
	clearspaceViewerWidget: {
		manifest: CLEARSPACE_VIEWER_MANIFEST,
		toRestrictions: () => ({ controls: [] }),
	},
	// 자기 그림(락업 Canvas)을 그리면서 컨트롤을 여는 위젯 — 배치에 남는다(panelOnly 아님).
	ciLockupWidget: {
		manifest: CI_LOCKUP_MANIFEST,
		toRestrictions: (fields) => ({ controls: ciLockupRestrictions(fields) }),
	},
	layoutGridControlsWidget: {
		// 그릴 것이 없는 순수 패널 — 값을 심고 알약에 컨트롤을 올리는 일만 한다.
		panelOnly: true,
		manifest: LAYOUT_GRID_MANIFEST,
		toRestrictions: (fields) => ({
			controls: [
				foldRestriction('marginPct', fields.marginPct, fields.marginAdjustable),
				foldRestriction('gutterX', fields.gutterX, fields.gutterXAdjustable),
				foldRestriction('gutterY', fields.gutterY, fields.gutterYAdjustable),
				foldRestriction('guidesOn', fields.guidesOn, fields.guidesAdjustable),
			],
		}),
	},
}

/** 자식이 컨트롤러를 여는 블록인지 — 이름이 아니라 표로 판정한다. */
export function controllerEntryFor(blockType: string): ControllerEntry | undefined {
	return GUIDELINE_CONTROLLERS[blockType]
}
