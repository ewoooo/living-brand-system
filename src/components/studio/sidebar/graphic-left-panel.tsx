'use client'

import { ControllerRenderer } from '@/components/shared/controller-renderer'
import { StudioSidebar } from '@/components/studio/sidebar/studio-sidebar'
import { useGraphicStudio } from '@/features/graphic-generation/hooks/use-graphic-studio'
import { splitControllerGroups } from '@/modules/studio-controller/controller-definition'

/**
 * 캔버스 왼쪽 패널 — 창작자가 실제로 다루는 큰 축만 앉는다(색 조합·형태).
 *
 * 오른쪽 패널(`GraphicSidebar`)과 같은 껍데기를 쓰고 header·footer를 두지 않는다 —
 * 아이덴티티 카드와 내보내기는 오른쪽이 소유한다. 어느 축이 여기 오는지는 런타임이
 * `controller.left`로 선언한다.
 */
export function GraphicLeftPanel() {
	const { config, controls } = useGraphicStudio()
	const { left } = splitControllerGroups(
		config.controller.groups,
		config.controller.left,
		config.controller.right,
	)

	if (left.length === 0) return null

	return (
		<StudioSidebar>
			<ControllerRenderer
				groups={left}
				presentation={config.controllerPresentation}
				values={controls.values}
				bindings={controls.bindings}
				onChange={controls.update}
			/>
		</StudioSidebar>
	)
}
