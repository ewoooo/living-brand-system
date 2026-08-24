'use client'

import { Controller } from '@/components/shared/controller'
import {
	ControllerControlRenderer,
	ControllerGroupRenderer,
} from '@/components/shared/controller-renderer'
import {
	getImageColorAdjustmentControls,
	type ImageStudioConfig,
	type ImageStudioFeature,
} from '@/features/image-generation/domain/image-studio-config'
import type {
	ControllerControlValue,
	ControllerRuntimeBindings,
	ControllerValues,
} from '@/modules/studio-controller/controller-definition'
import { ImageCameraControl } from './image-camera-control'

export type ImageProfileCameraRuntime = {
	azimuthDeg: number
	elevationDeg: number
	seedImage: string | null
	busy: boolean
	onChange: (angles: { azimuthDeg: number; elevationDeg: number }) => void
	onRegenerate: () => void
}

type ImageProfileFeatureRendererProps = {
	config: ImageStudioConfig
	values: ControllerValues
	bindings?: ControllerRuntimeBindings
	onChange: (controlId: string, value: ControllerControlValue) => void
	camera?: ImageProfileCameraRuntime
	/**
	 * 프로파일 그룹을 하위 섹션으로 그린다 — Template처럼 **다른 그룹 안에서** 부를 때 준다.
	 * 🔴 기본값(false)은 Image 스튜디오의 최상위 호출이다. 거기서는 구분선이 맞다.
	 */
	attached?: boolean
	/** 하위 섹션도 「chevron만 토글」 규칙을 따르게 한다 — 한 패널 안에서 규칙이 갈리면 안 된다. */
	onActivate?: () => void
}

/** Image feature type을 bespoke UI 또는 참조된 공통 Controller control로 단일 dispatch한다. */
export function ImageProfileFeatureRenderer({
	config,
	values,
	bindings,
	onChange,
	camera,
	attached = false,
	onActivate,
}: ImageProfileFeatureRendererProps) {
	return config.image.features.map((feature) => {
		switch (feature.type) {
			case 'color-adjustment':
				return (
					<ColorAdjustmentFeature
						key={feature.type}
						config={config}
						feature={feature}
						values={values}
						bindings={bindings}
						attached={attached}
						onActivate={onActivate}
						onChange={onChange}
					/>
				)
			case 'camera-control':
				return camera ? (
					<CameraFeature key={feature.type} feature={feature} runtime={camera} />
				) : null
			default:
				return assertNever(feature)
		}
	})
}

function assertNever(value: never): never {
	throw new Error(`지원하지 않는 ImageStudioFeature입니다: ${JSON.stringify(value)}`)
}

function ColorAdjustmentFeature({
	config,
	feature,
	values,
	bindings,
	onChange,
	attached = false,
	onActivate,
}: Omit<ImageProfileFeatureRendererProps, 'camera'> & {
	feature: Extract<ImageStudioFeature, { type: 'color-adjustment' }>
}) {
	const controls = getImageColorAdjustmentControls(config)
	if (!controls) return null
	const ids = new Set([feature.controls.line, feature.controls.background].filter(Boolean))

	return config.controller.groups.map((group) => {
		const definitions = group.controls.filter((control) => ids.has(control.id))
		if (definitions.length === 0) return null
		const content = definitions.map((definition) => (
			<ControllerControlRenderer
				key={definition.id}
				definition={definition}
				value={definition.id in values ? values[definition.id] : definition.defaultValue}
				binding={bindings?.[definition.id]}
				onChange={(value) => onChange(definition.id, value)}
			/>
		))

		return (
			<ControllerGroupRenderer
				key={`${feature.type}:${group.id}`}
				definition={group}
				attached={attached}
				onActivate={onActivate}
				presentation={config.controllerPresentation?.groups.find(
					({ groupId }) => groupId === group.id,
				)}
			>
				{content}
			</ControllerGroupRenderer>
		)
	})
}

function CameraFeature({
	feature,
	runtime,
}: {
	feature: Extract<ImageStudioFeature, { type: 'camera-control' }>
	runtime: ImageProfileCameraRuntime
}) {
	return (
		<Controller.Group title="Camera Controls" collapsible disabled={!runtime.seedImage}>
			{runtime.seedImage && (
				<ImageCameraControl
					azimuthDeg={runtime.azimuthDeg}
					elevationDeg={runtime.elevationDeg}
					seedImage={runtime.seedImage}
					busy={runtime.busy}
					azimuths={feature.azimuths}
					elevations={feature.elevations}
					onChange={runtime.onChange}
					onRegenerate={runtime.onRegenerate}
				/>
			)}
		</Controller.Group>
	)
}
