'use client'

import { Copy, Crop, SquareOutline } from '@carbon/icons-react'
import type * as React from 'react'
import { Controller } from '@/components/shared/controller'
import {
	ControllerControlRenderer,
	ControllerGroupRenderer,
} from '@/components/shared/controller-renderer'
import { ImageProfileFeatureRenderer } from '@/components/studio/image/image-profile-feature-renderer'
import { StudioSidebar } from '@/components/studio/sidebar/studio-sidebar'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Typography } from '@/components/ui/typography'
import type {
	ImageAspectRatio,
	ImageOutputSize,
} from '@/features/image-generation/domain/image-size'
import {
	getImageStudioControls,
	getImageStudioFeatureControlIds,
	IMAGE_STUDIO_CONTROL_IDS,
} from '@/features/image-generation/domain/image-studio-config'
import { useImageStudio } from '@/features/image-generation/hooks/use-image-studio'
import {
	type ControllerControlDefinition,
	type ControllerRuntimeBinding,
	resolveControllerAvailability,
} from '@/modules/studio-controller/controller-definition'

/**
 * 이미지 스튜디오의 사이드바(컨트롤러 패널) — 캔버스를 모른다.
 * 무엇을 그릴지는 편집 계약(config)만 보고 결정하고(색 섹션·카메라 섹션·읽기 전용 파생),
 * 세션 값은 컨텍스트의 prompt/generation/camera 그룹으로만 읽고 쓴다.
 * 디자인 SSOT: Figma HD_LBS_UI section 16:9137 "Image Usecase".
 */
export function ImageSidebar() {
	const { config, controls, generation, camera, reference } = useImageStudio()
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
		<StudioSidebar
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
								onChange={(value) => generation.setRatio(value as ImageAspectRatio)}
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
				</>
			}
		>
			{/*
			 * 생성 CTA는 그룹 밖이 아니라 프롬프트가 사는 그룹 안, 프롬프트 바로 아래에 붙는다 —
			 * 그룹 밖에 두면 바로 위 feature 그룹의 CTA(카메라 재생성)와 나란히 보여 무엇을
			 * 생성하는 버튼인지 구조가 말해 주지 못한다. 그래서 통짜 ControllerRenderer 대신
			 * 같은 투영을 group/control 단위로 조립한다.
			 */}
			{contentGroups.map((group) => (
				<ControllerGroupRenderer
					key={group.id}
					definition={group}
					presentation={config.controllerPresentation?.groups.find(
						({ groupId }) => groupId === group.id,
					)}
				>
					{group.controls.map((control) => (
						<ControllerControlRenderer
							key={control.id}
							definition={control}
							value={
								control.id in controls.values
									? controls.values[control.id]
									: control.defaultValue
							}
							binding={controls.bindings[control.id]}
							onChange={(value) => controls.update(control.id, value)}
						/>
					))}
					{group.controls.some(({ id }) => id === IMAGE_STUDIO_CONTROL_IDS.prompt) && (
						<>
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
						</>
					)}
				</ControllerGroupRenderer>
			))}
			{reference.preparing && (
				<div role="status">
					참조 이미지를 준비하고 있어요…
					<Button type="button" variant="ghost" size="sm" onClick={reference.clear}>
						취소
					</Button>
				</div>
			)}
			<ImageProfileFeatureRenderer
				config={config}
				values={controls.values}
				bindings={controls.bindings}
				onChange={controls.update}
				reference={{
					value: reference.value,
					name: reference.name,
					error: reference.error,
					busy: generation.busy,
					onAttach: reference.attach,
					onClear: reference.clear,
				}}
				camera={{
					azimuthDeg: camera.azimuthDeg,
					elevationDeg: camera.elevationDeg,
					seedImage: camera.seedImage,
					busy: generation.busy,
					onChange: camera.setAngles,
					onRegenerate: camera.regenerate,
				}}
			/>
		</StudioSidebar>
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
				// 압축 행은 패딩이 10px — 셀렉트 트리거가 행 폭을 재려면 변수도 같이 좁힌다.
				className="px-2.5 [--controller-row-px:0.625rem]"
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
