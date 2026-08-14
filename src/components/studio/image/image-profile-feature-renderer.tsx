'use client'

import { Controller } from '@/components/studio/shared/controller'
import {
	ControllerControlRenderer,
	ControllerGroupRenderer,
} from '@/components/studio/shared/controller-renderer'
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
}

/** Image feature type을 bespoke UI 또는 참조된 공통 Controller control로 단일 dispatch한다. */
export function ImageProfileFeatureRenderer({
	config,
	values,
	bindings,
	onChange,
	camera,
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
						onChange={onChange}
					/>
				)
			case 'camera-control':
				return camera ? <CameraFeature key={feature.type} runtime={camera} /> : null
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
			<ControllerGroupRenderer key={`${feature.type}:${group.id}`} definition={group}>
				{content}
			</ControllerGroupRenderer>
		)
	})
}

function CameraFeature({ runtime }: { runtime: ImageProfileCameraRuntime }) {
	return (
		<Controller.Group title="Camera Controls" disabled={!runtime.seedImage}>
			{runtime.seedImage && (
				<ImageCameraControl
					azimuthDeg={runtime.azimuthDeg}
					elevationDeg={runtime.elevationDeg}
					seedImage={runtime.seedImage}
					busy={runtime.busy}
					onChange={runtime.onChange}
					onRegenerate={runtime.onRegenerate}
				/>
			)}
		</Controller.Group>
	)
}
