'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import {
	type CameraAzimuth,
	type CameraElevation,
	resolveCameraControl,
} from '@/features/generate-image/camera-control'
import {
	type CameraAdjustmentResult,
	requestCameraAdjustment,
} from '@/features/generate-image/services/generate-image.client'
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

const ELEVATION_PRESETS: {
	degrees: number
	label: string
	value: CameraElevation
}[] = [
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

const SELECT_CLASS =
	'h-8 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30'

export function ImageCameraPresets({
	basePrompt,
	generatedImageId,
	profileId,
	seedImage,
}: {
	basePrompt: string
	generatedImageId: number
	profileId: number
	seedImage: string
}) {
	const [azimuthDeg, setAzimuthDeg] = useState(0)
	const [elevationDeg, setElevationDeg] = useState(0)
	const [result, setResult] = useState<CameraAdjustmentResult | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const azimuthPreset =
		AZIMUTH_PRESETS.find(
			(preset) => preset.degrees === snapCameraAngle(azimuthDeg, AZIMUTH_STEPS, true),
		) ?? AZIMUTH_PRESETS[0]
	const elevationPreset =
		ELEVATION_PRESETS.find(
			(preset) => preset.degrees === snapCameraAngle(elevationDeg, ELEVATION_STEPS),
		) ?? ELEVATION_PRESETS[1]

	async function applyCamera() {
		if (loading) return
		setLoading(true)
		setError('')
		setResult(null)
		try {
			setResult(
				await requestCameraAdjustment({
					basePrompt,
					camera: {
						azimuthDeg,
						elevationDeg,
					},
					count: 1,
					generatedImageId,
					profileId,
				}),
			)
		} catch {
			setError('시점 조정에 실패했어요. 잠시 후 다시 시도해 주세요.')
		} finally {
			setLoading(false)
		}
	}

	const resultAzimuth = result
		? AZIMUTH_PRESETS.find((preset) => preset.value === result.camera.resolved.azimuth)
		: null
	const resultElevation = result
		? ELEVATION_PRESETS.find((preset) => preset.value === result.camera.resolved.elevation)
		: null

	return (
		<section
			data-slot="image-camera-presets"
			className="flex flex-col gap-4 rounded-md border border-border p-4"
			aria-busy={loading}
		>
			<div className="flex flex-col gap-1">
				<Typography as="h3" size="base" weight="medium">
					카메라 시점 조정
				</Typography>
				<Typography size="sm" tone="muted">
					선택한 이미지를 시드로 사용합니다. 원본 이미지는 유지됩니다.
				</Typography>
			</div>

			<ImageCameraOrbitControl
				azimuthDeg={azimuthDeg}
				azimuthLabel={azimuthPreset.label}
				azimuthSteps={AZIMUTH_STEPS}
				elevationDeg={elevationDeg}
				elevationLabel={elevationPreset.label}
				elevationSteps={ELEVATION_STEPS}
				seedImage={seedImage}
				onChange={(angles) => {
					setAzimuthDeg(angles.azimuthDeg)
					setElevationDeg(angles.elevationDeg)
				}}
			/>

			<div className="grid gap-3 sm:grid-cols-2">
				<div className="flex flex-col gap-2">
					<Label htmlFor="camera-azimuth">방향</Label>
					<select
						id="camera-azimuth"
						value={azimuthPreset.value}
						onChange={(event) => {
							const preset = AZIMUTH_PRESETS.find(
								(item) =>
									item.value === (event.currentTarget.value as CameraAzimuth),
							)
							if (preset) setAzimuthDeg(preset.degrees)
						}}
						className={SELECT_CLASS}
					>
						{AZIMUTH_PRESETS.map((preset) => (
							<option key={preset.value} value={preset.value}>
								{preset.label}
							</option>
						))}
					</select>
				</div>
				<div className="flex flex-col gap-2">
					<Label htmlFor="camera-elevation">높이</Label>
					<select
						id="camera-elevation"
						value={elevationPreset.value}
						onChange={(event) => {
							const preset = ELEVATION_PRESETS.find(
								(item) =>
									item.value === (event.currentTarget.value as CameraElevation),
							)
							if (preset) setElevationDeg(preset.degrees)
						}}
						className={SELECT_CLASS}
					>
						{ELEVATION_PRESETS.map((preset) => (
							<option key={preset.value} value={preset.value}>
								{preset.label}
							</option>
						))}
					</select>
				</div>
			</div>

			<Button type="button" disabled={loading} onClick={applyCamera}>
				{loading ? '시점 조정 중…' : '시점 적용'}
			</Button>

			{error ? (
				<Typography role="alert" size="sm" tone="destructive">
					{error}
				</Typography>
			) : null}

			{result?.images[0] ? (
				<div className="flex flex-col gap-2" aria-live="polite">
					<Typography size="sm" weight="medium">
						조정 결과: {resultAzimuth?.label} · {resultElevation?.label}
					</Typography>
					{/* biome-ignore lint/performance/noImgElement: 생성 결과 저장 URL 미리보기 */}
					<img
						src={result.images[0]}
						alt="카메라 시점 조정 결과"
						className="w-full rounded-md border border-border"
					/>
					<a
						href={result.images[0]}
						target="_blank"
						rel="noreferrer"
						className="font-body text-sm font-normal text-muted-foreground underline"
					>
						조정 결과 원본 보기
					</a>
				</div>
			) : null}
		</section>
	)
}
