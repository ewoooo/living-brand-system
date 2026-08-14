'use client'

import { useState } from 'react'
import { ImageProfileFeatureRenderer } from '@/components/studio/image/image-profile-feature-renderer'
import { Controller } from '@/components/studio/shared/controller'
import {
	ControllerControlRenderer,
	ControllerGroupRenderer,
	ControllerRenderer,
} from '@/components/studio/shared/controller-renderer'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import { acceptsImagePromptExecution } from '@/features/image-generation/domain/image-studio-config'
import type { ResolvedTemplateImageConfig } from '@/features/template-customization/domain/template-studio-config'
import type {
	TemplateBackgroundPatch,
	TemplateBackgroundState,
} from '@/features/template-customization/hooks/use-template-studio'
import type {
	ControllerControlDefinition,
	ControllerControlValue,
	ControllerGroupDefinition,
	ControllerGroupPresentation,
	ControllerRuntimeBindings,
} from '@/modules/studio-controller/controller-definition'
import {
	IMAGE_TRANSFORM_DEFAULT,
	ImageTransformControl,
	type ImageTransformValue,
} from './image-transform-control'

type BackgroundSectionProps = {
	groupDefinition: ControllerGroupDefinition
	groupPresentation?: ControllerGroupPresentation
	/** Template의 공통 Controller Definition — availability와 options를 그대로 소비한다. */
	typeDefinition: Extract<ControllerControlDefinition, { kind: 'select' }>
	colorDefinition: Extract<ControllerControlDefinition, { kind: 'color' }>
	/** 템플릿 캔버스 종횡비(w/h) — 배경 transform 패드가 같은 비율로 그려진다. */
	canvasAspectRatio?: number
	/** Image Config를 캔버스 비율로 제한한 슬롯 범위 계약. */
	imageContracts: readonly ResolvedTemplateImageConfig[]
	featureBindings: ControllerRuntimeBindings
	graphicConfigs: readonly GraphicStudioConfig[]
	graphicBindings: ControllerRuntimeBindings
	/** 배경 세션 상태 — 소유는 Provider(합성에 싣는다). */
	value: TemplateBackgroundState
	onChange: (patch: TemplateBackgroundPatch) => void
	onColorChange: (value: ControllerControlValue) => void
	onTypeChange: (value: ControllerControlValue) => void
	onFeatureChange: (controlId: string, value: ControllerControlValue) => void
	onImageProfileChange: (profileId: number) => void
	onGraphicConfigChange: (configId: string) => void
	onGraphicChange: (controlId: string, value: ControllerControlValue) => void
	onGenerate: () => void
}

/**
 * 디자인 SSOT(2:2071 Sidebar State)의 Background 상태 분기 — Type이 하위 컨트롤 세트를 갈아끼운다.
 * Color: 배경색 / Image: Preset(브랜드 이미지 선택)·Generate(프롬프트 생성) + Image Transform /
 * Graphic: Graphic Config 선택 + 해당 Config의 공통 Controller Definition.
 *
 * 값·프롬프트·생성 중·실패와 HTTP는 Provider가 슬롯 단위로 소유한다. Graphic은 순수 SVG adapter로 compose하고,
 * 경로가 없는 Preset 브라우즈·배경 이미지 feature 색 행·Image Transform만 잠가 스테이징한다.
 */
export function BackgroundSection({
	groupDefinition,
	groupPresentation,
	typeDefinition,
	colorDefinition,
	canvasAspectRatio,
	imageContracts,
	featureBindings,
	graphicConfigs,
	graphicBindings,
	value,
	onChange,
	onColorChange,
	onTypeChange,
	onFeatureChange,
	onImageProfileChange,
	onGraphicConfigChange,
	onGraphicChange,
	onGenerate,
}: BackgroundSectionProps) {
	const { type, imageMode } = value
	const [imageTransform, setImageTransform] =
		useState<ImageTransformValue>(IMAGE_TRANSFORM_DEFAULT)
	const imageContract = imageContracts.find((contract) => contract.config.id === value.profileId)
	const graphicConfig = graphicConfigs.find((candidate) => candidate.id === value.graphicConfigId)

	const invalidPrompt = imageContract
		? !acceptsImagePromptExecution(imageContract.prompt, value.prompt)
		: true
	return (
		<ControllerGroupRenderer definition={groupDefinition} presentation={groupPresentation}>
			<ControllerControlRenderer
				definition={typeDefinition}
				value={type}
				onChange={onTypeChange}
			/>

			{type === 'color' && (
				<ControllerControlRenderer
					definition={colorDefinition}
					value={value.color}
					onChange={onColorChange}
				/>
			)}

			{type === 'image' && (
				<>
					<Controller.Row label="Image Type">
						<Controller.Segmented
							aria-label="배경 이미지 방식"
							options={[
								{ value: 'preset', label: 'Preset' },
								{ value: 'generate', label: 'Generate' },
							]}
							value={imageMode}
							onChange={(next) => onChange({ imageMode: next })}
						/>
					</Controller.Row>
					<Controller.TabPanel tabKey={imageMode}>
						{imageMode === 'preset' ? (
							// 브랜드 이미지 목록 배선이 남아 잠긴 채 그린다 — 패널 본문이 없다.
							<Controller.AssetCard
								title="이미지를 선택하세요"
								subtitle="Brand Image"
								buttonLabel="Browse"
								aria-label="브랜드 이미지 선택"
								disabled
							/>
						) : (
							<>
								<Controller.Row label="Image Profile">
									<Controller.Select
										options={imageContracts.map(({ config }) => ({
											value: String(config.id),
											label: config.name,
										}))}
										value={
											value.profileId === undefined
												? undefined
												: String(value.profileId)
										}
										onChange={(next) => onImageProfileChange(Number(next))}
										placeholder="사용 가능한 프로파일 없음"
										disabled={value.generating || imageContracts.length === 0}
									/>
								</Controller.Row>
								{imageContract && (
									<>
										<ImageProfileFeatureRenderer
											config={imageContract.config}
											values={value.featureValues}
											bindings={featureBindings}
											onChange={onFeatureChange}
										/>
										<ControllerControlRenderer
											definition={imageContract.prompt}
											value={value.prompt}
											onChange={(next) => {
												if (typeof next === 'string')
													onChange({ prompt: next })
											}}
										/>
										<ControllerControlRenderer
											definition={imageContract.ratio}
											value={imageContract.ratio.defaultValue}
											onChange={() => {}}
										/>
									</>
								)}
								<Button
									type="button"
									variant="muted"
									className="mt-0.5 h-11 w-full text-sm font-semibold"
									onClick={onGenerate}
									disabled={value.generating || invalidPrompt}
								>
									{value.generating ? '생성 중…' : '이미지 생성'}
								</Button>
								{value.error && <FieldError>{value.error}</FieldError>}
							</>
						)}
					</Controller.TabPanel>
					{/* Image Transform은 compose 경로가 없어 잠근 채, 대상인 Background 안에서 그린다. */}
					<Controller.Group title="Image Transform" collapsible attached disabled>
						<ImageTransformControl
							value={imageTransform}
							aspectRatio={canvasAspectRatio}
							onChange={setImageTransform}
						/>
					</Controller.Group>
				</>
			)}

			{type === 'graphic' && (
				<>
					<Controller.Row label="Graphic Type">
						<Controller.Select
							options={graphicConfigs.map((config) => ({
								value: config.id,
								label: config.name,
							}))}
							value={value.graphicConfigId}
							onChange={onGraphicConfigChange}
							placeholder="사용 가능한 그래픽 없음"
							disabled={graphicConfigs.length === 0}
						/>
					</Controller.Row>
					{/* 선택한 Graphic의 그룹은 Background에 종속된다 — Background를 접으면 함께 닫힌다. */}
					{graphicConfig && (
						<ControllerRenderer
							groups={graphicConfig.controller.groups}
							presentation={graphicConfig.controllerPresentation}
							values={value.graphicValues}
							bindings={graphicBindings}
							onChange={onGraphicChange}
						/>
					)}
				</>
			)}
		</ControllerGroupRenderer>
	)
}
