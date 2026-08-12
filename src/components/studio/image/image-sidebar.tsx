'use client'

import { Copy, Crop, SquareOutline } from '@carbon/icons-react'
import type * as React from 'react'
import { Controller } from '@/components/studio/shared/controller'
import { ControllerRenderer } from '@/components/studio/shared/controller-renderer'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Typography } from '@/components/ui/typography'
import type { ImageAspectRatio, ImageOutputSize } from '@/features/generate-image/image-size'
import { useImageStudio } from '@/features/image-studio/hooks/use-image-studio'
import {
	getImageStudioControls,
	getImageStudioFeatureControlIds,
	IMAGE_STUDIO_CONTROL_IDS,
} from '@/features/image-studio/image-studio-config'
import {
	type ControllerControlDefinition,
	type ControllerRuntimeBinding,
	resolveControllerAvailability,
} from '@/features/studio-controller/controller-definition'
import { ImageProfileFeatureRenderer } from './image-profile-feature-renderer'
import { ImageProfilePicker } from './image-profile-picker'

/**
 * 이미지 스튜디오의 사이드바(컨트롤러 패널) — 캔버스를 모른다.
 * 무엇을 그릴지는 편집 계약(config)만 보고 결정하고(색 섹션·카메라 섹션·읽기 전용 파생),
 * 세션 값은 컨텍스트의 prompt/generation/camera 그룹으로만 읽고 쓴다.
 * 디자인 SSOT: Figma HD_LBS_UI section 16:9137 "Image Usecase".
 */
export function ImageSidebar() {
	const { config, profiles, controls, generation, camera, results, download } = useImageStudio()
	const { batch, ratio, resolution } = getImageStudioControls(config)
	const generationControlIds = new Set<string>([
		IMAGE_STUDIO_CONTROL_IDS.batch,
		IMAGE_STUDIO_CONTROL_IDS.ratio,
		IMAGE_STUDIO_CONTROL_IDS.resolution,
	])
	const featureControlIds = new Set(getImageStudioFeatureControlIds(config))
	const contentGroups = config.controller.groups.flatMap((group) => {
		const controls = group.controls.filter(
			(control) =>
				!generationControlIds.has(control.id) && !featureControlIds.has(control.id),
		)
		return controls.length > 0 ? [{ ...group, controls }] : []
	})

	return (
		// 자산 브라우저의 열림은 편집 세션이 아니라 이 화면의 표현 상태다 — 킷이 소유한다(Provider에 넣지 않는다).
		<Controller.Browser.Root>
			<Controller.Panel
				footer={
					<>
						<div className="flex flex-col gap-1">
							<div className="flex h-9 items-center pt-1">
								<span className="font-semibold text-muted-foreground text-sm">
									Setting
								</span>
							</div>
							{/* 디자인 SSOT(16:9079): 장수·비율·해상도가 한 줄에 3등분으로 앉는다. */}
							<div className="grid grid-cols-3 gap-1">
								<SettingRow
									icon={<Copy aria-hidden />}
									definition={batch}
									binding={controls.bindings[batch.id]}
									value={String(generation.batch)}
									onChange={(value) => generation.setBatch(Number(value))}
								/>
								<SettingRow
									icon={<SquareOutline aria-hidden />}
									definition={ratio}
									binding={controls.bindings[ratio.id]}
									value={generation.ratio}
									onChange={(value) =>
										generation.setRatio(value as ImageAspectRatio)
									}
								/>
								<SettingRow
									icon={<Crop aria-hidden />}
									definition={resolution}
									binding={controls.bindings[resolution.id]}
									value={generation.resolution}
									onChange={(value) =>
										generation.setResolution(value as ImageOutputSize)
									}
								/>
							</div>
						</div>
						<div className="flex gap-2">
							{/* 색이 있으면 색을 구운 PNG, 없으면 원본이다 — 판정은 Provider가 한다. */}
							<Button
								className="h-11 flex-1"
								onClick={download.selected}
								disabled={
									download.busy ||
									!download.available ||
									results.selected === null
								}
							>
								선택한 이미지 저장
							</Button>
							<Button
								variant="muted"
								className="h-11 flex-1"
								onClick={download.all}
								disabled={
									download.busy ||
									!download.available ||
									!results.result?.images.length
								}
							>
								전부 저장
							</Button>
						</div>
						{download.error && (
							<Typography role="alert" size="sm" className="text-destructive">
								{download.error}
							</Typography>
						)}
					</>
				}
			>
				{/* 교체는 컨트롤러 왼쪽에 뜨는 자산 브라우저가 받는다 — 세션을 유지하는
				    교체 동작은 컨텍스트의 profiles.select가 소유한다. */}
				<Controller.AssetCard
					title={config.name}
					buttonLabel="Change"
					aria-label="프로파일 변경"
					tabs={['Image Profiles']}
					empty={
						profiles.options.length <= 1
							? '교체할 다른 이미지 프로파일이 없습니다.'
							: undefined
					}
				>
					<ImageProfilePicker />
				</Controller.AssetCard>

				<ControllerRenderer
					groups={contentGroups}
					values={controls.values}
					bindings={controls.bindings}
					onChange={controls.update}
				/>
				<ImageProfileFeatureRenderer
					config={config}
					values={controls.values}
					bindings={controls.bindings}
					onChange={controls.update}
					camera={{
						azimuthDeg: camera.azimuthDeg,
						elevationDeg: camera.elevationDeg,
						seedImage: camera.seedImage,
						busy: generation.busy,
						onChange: camera.setAngles,
						onRegenerate: camera.regenerate,
					}}
				/>
				<Button
					variant="muted"
					className="mt-0.5 h-11 w-full font-semibold text-sm"
					onClick={generation.run}
					disabled={generation.busy || !generation.canRun}
				>
					{generation.busy ? '생성 중…' : '이미지 생성'}
				</Button>
				{generation.error && (
					<Typography role="alert" size="sm" className="text-destructive">
						{generation.error}
					</Typography>
				)}
			</Controller.Panel>
		</Controller.Browser.Root>
	)
}

type SettingRowProps = {
	/** 아이콘 라벨 — 접근 가능한 이름은 name이 sr-only로 동반한다(docs/10 §3.6). */
	icon: React.ReactNode
	definition: Extract<ControllerControlDefinition, { kind: 'select' }>
	binding?: ControllerRuntimeBinding
	value: string
	onChange: (value: string) => void
}

/** Setting 푸터의 압축 레이아웃에 Definition의 상태와 선택지를 결합한다. */
function SettingRow({ icon, definition, binding, value, onChange }: SettingRowProps) {
	const availability = resolveControllerAvailability(
		definition.availability,
		binding?.availability,
	)
	const disabled = availability === 'disabled'
	const readonly = availability === 'readonly' || (!disabled && definition.options.length <= 1)

	return (
		<div className="flex flex-col gap-1">
			<Controller.Row
				label={
					<>
						{icon}
						<span className="sr-only">{definition.label}</span>
					</>
				}
				readonly={readonly}
				disabled={disabled}
				className="px-2.5"
			>
				{readonly ? (
					<span className="text-muted-foreground text-sm">{value}</span>
				) : (
					<Controller.Select
						options={definition.options}
						value={value}
						onChange={onChange}
					/>
				)}
			</Controller.Row>
			{binding?.error && <FieldError>{binding.error}</FieldError>}
		</div>
	)
}
