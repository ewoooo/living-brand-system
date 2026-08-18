'use client'

import { ControllerRange } from '@/components/shared/controller'

export const DEFAULT_PREVIEW_SIZE = 50

/**
 * 출력에는 영향 없이 데스크톱 캔버스의 표시 크기만 조절한다.
 * 트랙·채움·키보드는 킷의 Value Range 프리미티브가 소유한다(docs/10 §3.6) — 여기서는
 * 이 컨트롤이 무엇을 재는지(라벨·범위·표기)만 고정한다.
 * 떠 있는 자리는 `ControllerBar`가 갖는다(`components/shared/controller/bar.tsx`).
 */
export function PreviewSizeControl({
	value,
	onChange,
}: {
	value: number
	onChange: (value: number) => void
}) {
	return (
		<ControllerRange
			label="Preview Size"
			value={value}
			min={25}
			max={100}
			step={5}
			format={(size) => `${size}%`}
			onChange={onChange}
			className="w-48"
		/>
	)
}
