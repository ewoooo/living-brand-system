'use client'

import { Fragment } from 'react'
import { ControllerControlRenderer } from '@/components/shared/controller-renderer'
import { Separator } from '@/components/ui/separator'
import { useGuidelineController } from './provider'

/**
 * 실효 그룹을 하단 알약 한 줄로 그린다. **도메인을 모른다** — `kind`만 보고 프리미티브를 고르는
 * 일은 `ControllerControlRenderer`가 이미 하므로 여기서는 배치만 소유한다.
 *
 * 사이드바 렌더러(`ControllerRenderer`)와 다른 점은 둘뿐이다:
 * - 그룹을 접이식 제목이 아니라 **구분선**으로 가른다(Figma HD_LBS_UI 61:4672).
 * - 🔴 `readonly` 컨트롤을 **싣지 않는다.** 떠 있는 바에 못 만지는 판독 줄이 끼면 폭만 먹고,
 *   admin이 고정한 값은 그림 자체가 이미 보여준다. 값은 그대로 남으므로 판형은 고정값으로 그려진다
 *   (Figma의 Layout Type 1이 마진 하나만 실은 것이 이 경우다).
 */
export function GuidelineControllerPill() {
	const { groups, values, set } = useGuidelineController()

	const visible = groups
		.map((group) => ({
			...group,
			controls: group.controls.filter((control) => control.availability !== 'readonly'),
		}))
		.filter((group) => group.controls.length > 0)

	if (visible.length === 0) return null

	return (
		<>
			{visible.map((group, index) => (
				<Fragment key={group.id}>
					{index > 0 && <Separator orientation="vertical" className="h-6" />}
					{group.controls.map((control) => (
						<ControllerControlRenderer
							key={control.id}
							definition={control}
							value={control.id in values ? values[control.id] : control.defaultValue}
							onChange={(value) => set(control.id, value)}
						/>
					))}
				</Fragment>
			))}
		</>
	)
}
