import { findCiLockupColors } from '@/features/guideline/repositories/ci-lockup-colors.payload.repository'
import type { CiLockupWidget as CiLockupWidgetRow } from '@/payload-types'
import { type CiLockupFixed, CiLockupView } from './view'

export async function CiLockupWidget({ fixed }: { fixed?: CiLockupFixed }) {
	return <CiLockupView colors={await findCiLockupColors()} fixed={fixed} />
}

/** 카드 디스플레이 진입점 — 자기 행을 받아 뷰로 넘긴다. `displays/registry.render.tsx`가 부른다. */
export default function CiLockupDisplay({ display }: { display: CiLockupWidgetRow }) {
	return (
		// 🔑 축마다의 고정값을 그대로 넘긴다 — 알약에서 뺀 축에만 적용된다(`view.tsx`의 `pick`). 카드 안에서는
		//    컨트롤러 스코프가 없어 전부 고정값으로 그려진다(2026-09-07 결정 B).
		<CiLockupWidget
			fixed={{
				h: display.h,
				subsidiaryOn: display.subsidiaryOn,
				subsidiary: display.subsidiary,
				branchOn: display.branchOn,
				branch: display.branch,
				form: display.form,
				language: display.language,
				colorType: display.colorType,
				mono: display.mono,
				clearSpace: display.clearSpace,
				measured: display.measured,
				heightControl: display.heightControl,
				hiddenControls: display.hiddenControls,
			}}
		/>
	)
}
