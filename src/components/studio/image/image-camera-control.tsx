'use client'

import { Controller } from '@/components/studio/shared/controller'
import { Button } from '@/components/ui/button'
import {
	type CameraAzimuth,
	type CameraElevation,
	resolveCameraControl,
} from '@/features/generate-image/camera-control'
import { ImageCameraOrbitControl, snapCameraAngle } from './image-camera-orbit-control'

// 각 프리셋의 버킷(value)은 도메인 임계값과 어긋나지 않도록 resolveCameraControl로 도출한다.
const AZIMUTH_PRESETS: { degrees: number; label: string; value: CameraAzimuth }[] = [
	{ degrees: 0, label: '정면' },
	{ degrees: 45, label: '우측 3/4' },
	{ degrees: 90, label: '우측면' },
	{ degrees: 135, label: '후면 우측 3/4' },
	{ degrees: 180, label: '후면' },
	{ degrees: -135, label: '후면 좌측 3/4' },
	{ degrees: -90, label: '좌측면' },
	{ degrees: -45, label: '좌측 3/4' },
].map((preset) => ({
	...preset,
	value: resolveCameraControl({ azimuthDeg: preset.degrees, elevationDeg: 0 }).azimuth,
}))

const ELEVATION_PRESETS: { degrees: number; label: string; value: CameraElevation }[] = [
	{ degrees: -20, label: '로우 앵글' },
	{ degrees: 0, label: '눈높이' },
	{ degrees: 20, label: '약간 위' },
	{ degrees: 50, label: '하이 앵글' },
	{ degrees: 80, label: '탑뷰' },
].map((preset) => ({
	...preset,
	value: resolveCameraControl({ azimuthDeg: 0, elevationDeg: preset.degrees }).elevation,
}))

const AZIMUTH_STEPS = AZIMUTH_PRESETS.map((preset) => preset.degrees)
const ELEVATION_STEPS = ELEVATION_PRESETS.map((preset) => preset.degrees)
const AZIMUTH_OPTIONS = AZIMUTH_PRESETS.map(({ label, value }) => ({ label, value }))
const ELEVATION_OPTIONS = ELEVATION_PRESETS.map(({ label, value }) => ({ label, value }))

type CameraAngles = { azimuthDeg: number; elevationDeg: number }

type ImageCameraControlProps = CameraAngles & {
	/** 시점을 다시 잡을 대상 — 오빗 프리뷰의 텍스처가 된다. */
	seedImage: string
	busy: boolean
	onChange: (angles: CameraAngles) => void
	onRegenerate: () => void
}

/**
 * 이미지 스튜디오의 카메라 시점 컨트롤 — 킷의 CameraControl(정사각 프리뷰 + 반폭 축 셀렉트)에
 * 도메인 프리셋을 붙인다. 각도·요청은 세션(ImageStudioProvider)이 소유하고 여기는 표현만 한다.
 */
export function ImageCameraControl({
	azimuthDeg,
	elevationDeg,
	seedImage,
	busy,
	onChange,
	onRegenerate,
}: ImageCameraControlProps) {
	const azimuthPreset =
		AZIMUTH_PRESETS.find(
			(preset) => preset.degrees === snapCameraAngle(azimuthDeg, AZIMUTH_STEPS, true),
		) ?? AZIMUTH_PRESETS[0]
	const elevationPreset =
		ELEVATION_PRESETS.find(
			(preset) => preset.degrees === snapCameraAngle(elevationDeg, ELEVATION_STEPS),
		) ?? ELEVATION_PRESETS[1]

	return (
		<div className="flex flex-col gap-1.5 pb-2.5">
			{/* 디자인 SSOT(16:9035): X는 방위각, Y는 높이다. */}
			<Controller.CameraControl
				axes={[
					{
						label: 'X',
						options: AZIMUTH_OPTIONS,
						value: azimuthPreset.value,
						onChange: (value) => {
							const preset = AZIMUTH_PRESETS.find((item) => item.value === value)
							if (preset) onChange({ azimuthDeg: preset.degrees, elevationDeg })
						},
					},
					{
						label: 'Y',
						options: ELEVATION_OPTIONS,
						value: elevationPreset.value,
						onChange: (value) => {
							const preset = ELEVATION_PRESETS.find((item) => item.value === value)
							if (preset) onChange({ azimuthDeg, elevationDeg: preset.degrees })
						},
					},
				]}
			>
				<ImageCameraOrbitControl
					azimuthDeg={azimuthDeg}
					azimuthLabel={azimuthPreset.label}
					azimuthSteps={AZIMUTH_STEPS}
					elevationDeg={elevationDeg}
					elevationLabel={elevationPreset.label}
					elevationSteps={ELEVATION_STEPS}
					seedImage={seedImage}
					onChange={onChange}
				/>
			</Controller.CameraControl>
			<Button
				type="button"
				variant="muted"
				className="mt-0.5 h-11 w-full font-semibold text-sm"
				disabled={busy}
				onClick={onRegenerate}
			>
				{busy ? '생성 중…' : '이미지 생성'}
			</Button>
		</div>
	)
}
