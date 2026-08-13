'use client'

import type * as React from 'react'
import { ControllerRow } from './row'
import { ControllerSelect } from './select'

type ControllerCameraAxis = {
	/** 축 라벨(X·Y) — Row 자동 배선으로 셀렉트의 접근 가능한 이름이 된다. */
	label: string
	options: readonly { value: string; label: string }[]
	value: string
	onChange: (value: string) => void
}

type ControllerCameraControlProps = {
	/** 3D 오빗 프리뷰(ImageCameraOrbitControl 등) — 정사각 컨테이너에 담긴다. */
	children: React.ReactNode
	/** 프리뷰 아래 반폭으로 나란히 앉는 축 셀렉트들. */
	axes: readonly ControllerCameraAxis[]
}

/**
 * 카메라 컨트롤(디자인 4:5858) — 정사각 프리뷰 + 반폭 축 셀렉트 스택.
 * 프리뷰 렌더러(three.js 오빗)는 소비자가 children으로 넣는다 — 킷은 배치 언어만 소유한다.
 */
export function ControllerCameraControl({ children, axes }: ControllerCameraControlProps) {
	return (
		<div data-slot="controller-camera-control" className="flex flex-col gap-1.5">
			<div className="aspect-square w-full shrink-0 overflow-hidden rounded-lg bg-muted">
				{children}
			</div>
			<div className="grid grid-cols-2 gap-1.5">
				{axes.map((axis) => (
					<ControllerRow key={axis.label} label={axis.label}>
						<ControllerSelect
							options={axis.options}
							value={axis.value}
							onChange={axis.onChange}
						/>
					</ControllerRow>
				))}
			</div>
		</div>
	)
}
