import type {
	ControllerControlRestriction,
	StudioControllerRestrictions,
} from '@/modules/studio-controller/controller-definition'
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

export const GUIDELINE_CONTROLLERS: Readonly<Record<string, ControllerEntry>> = {
	layoutGridControlsWidget: {
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
