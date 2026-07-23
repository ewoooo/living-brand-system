'use client'

import { useState } from 'react'
import {
	ClearSpaceView,
	StemMeasure,
	type StemMeasurement,
} from '@/features/guideline/blocks/stem-clear-space/view'

// 실제 essenherb 로고(S3 brand-logos, Payload 서빙). viewBox 891×185.
const essenherbLogo = '/api/brand-logos/file/logo_main_horizontal.svg'

// 측정 → 뷰어 흐름 데모. admin에서 측정한 값(두께·위치)이 뷰어로 전달되는 구조를 kit에서 확인한다.
// 실제 컴포넌트는 blocks/clear-space가 소유하고, kit은 그것을 불러와 실험한다.
export function LogoClearSpaceUnitDemo() {
	const [stem, setStem] = useState<StemMeasurement>({ ratio: 12 / 360, x: 0.5 }) // 폴백값

	return (
		<div className="flex flex-col gap-6">
			<div>
				<p className="mb-2 font-body font-semibold text-sm">1. 측정 (admin authoring)</p>
				<StemMeasure logo={essenherbLogo} value={stem} onChange={setStem} />
			</div>
			<div>
				<p className="mb-2 font-body font-semibold text-sm">2. 뷰어 (발행 화면)</p>
				<ClearSpaceView
					logoSrc={essenherbLogo}
					stemRatio={stem.ratio}
					stemX={stem.x}
					multiplier={3}
					tint="234 83 67"
				/>
			</div>
		</div>
	)
}
