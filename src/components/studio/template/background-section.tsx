'use client'

import { useState } from 'react'
import { ImageProfileFeatureRenderer } from '@/components/studio/image/image-profile-feature-renderer'
import { Controller } from '@/components/studio/shared/controller'
import {
	ControllerControlRenderer,
	ControllerRenderer,
} from '@/components/studio/shared/controller-renderer'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Typography } from '@/components/ui/typography'
import type { GraphicStudioConfig } from '@/features/graphic-studio/graphic-studio-config'
import { getImageColorAdjustmentControls } from '@/features/image-studio/image-studio-config'
import type {
	ControllerControlDefinition,
	ControllerControlValue,
	ControllerRuntimeBindings,
} from '@/features/studio-controller/controller-definition'
import type {
	TemplateBackgroundPatch,
	TemplateBackgroundState,
} from '@/features/template-studio/hooks/use-template-studio'
import type { ResolvedTemplateImageConfig } from '@/features/template-studio/template-config'
import {
	IMAGE_TRANSFORM_DEFAULT,
	ImageTransformControl,
	type ImageTransformValue,
} from './image-transform-control'

type BackgroundSectionProps = {
	/** Template의 공통 Controller Definition — availability와 options를 그대로 소비한다. */
	typeDefinition: Extract<ControllerControlDefinition, { kind: 'select' }>
	/** 템플릿 캔버스 종횡비(w/h) — 배경 transform 패드가 같은 비율로 그려진다. */
	canvasAspectRatio?: number
	/** Image Config를 캔버스 비율로 제한한 슬롯 범위 계약. */
	imageContracts: readonly ResolvedTemplateImageConfig[]
	graphicConfigs: readonly GraphicStudioConfig[]
	graphicBindings: ControllerRuntimeBindings
	/** 배경 세션 상태 — 소유는 Provider(합성에 싣는다). */
	value: TemplateBackgroundState
	onChange: (patch: TemplateBackgroundPatch) => void
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
	typeDefinition,
	canvasAspectRatio,
	imageContracts,
	graphicConfigs,
	graphicBindings,
	value,
	onChange,
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

	const maxPromptLength = imageContract?.prompt.maxLength
	const promptIsFixed =
		imageContract?.prompt.availability === 'readonly' ||
		imageContract?.prompt.availability === 'disabled'
	const invalidPrompt = promptIsFixed
		? !imageContract?.prompt.defaultValue?.trim() ||
			value.prompt !== imageContract.prompt.defaultValue
		: !value.prompt.trim() ||
			(maxPromptLength !== undefined && value.prompt.length > maxPromptLength)
	const colorControls = imageContract
		? getImageColorAdjustmentControls(imageContract.config)
		: null
	const featureBindings: ControllerRuntimeBindings = colorControls
		? Object.fromEntries(
				[colorControls.line, colorControls.background]
					.filter((control) => control !== undefined)
					.map((control) => [control.id, { availability: 'disabled' as const }]),
			)
		: {}

	return (
		<>
			<Controller.Group title="Background" collapsible>
				<ControllerControlRenderer
					definition={typeDefinition}
					value={type}
					onChange={onTypeChange}
				/>

				{type === 'color' && (
					<Controller.ColorRow
						label="Background Color"
						value={value.color ?? '#ffffff'}
						isEmpty={value.color === null}
						onReset={() => onChange({ color: null })}
						onChange={(hex) => onChange({ color: hex })}
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
								<div
									data-slot="background-browse-card"
									className="flex shrink-0 items-center justify-between gap-3 rounded-md bg-foreground p-4 text-background"
								>
									<div className="flex min-w-0 flex-col">
										<Typography
											as="p"
											size="sm"
											weight="medium"
											className="truncate"
										>
											이미지를 선택하세요
										</Typography>
										<Typography
											as="p"
											size="xs"
											className="truncate text-background/60"
										>
											Brand Image
										</Typography>
									</div>
									<Button
										type="button"
										variant="muted"
										size="sm"
										disabled
										className="shrink-0 rounded-lg bg-background/25 text-background text-xs hover:bg-background/35"
									>
										Browse
									</Button>
								</div>
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
											disabled={
												value.generating || imageContracts.length === 0
											}
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
										disabled={
											value.generating || !imageContract || invalidPrompt
										}
									>
										{value.generating ? '생성 중…' : '이미지 생성'}
									</Button>
									{value.error && <FieldError>{value.error}</FieldError>}
								</>
							)}
						</Controller.TabPanel>
					</>
				)}

				{type === 'graphic' && (
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
				)}
			</Controller.Group>

			{type === 'graphic' && graphicConfig && (
				<ControllerRenderer
					groups={graphicConfig.controller.groups}
					values={value.graphicValues}
					bindings={graphicBindings}
					onChange={onGraphicChange}
				/>
			)}

			{/* Image Transform은 compose 경로가 없어 Background의 형제 섹션에서 잠근다. */}
			{type === 'image' && (
				<Controller.Group
					title="Image Transform"
					collapsible
					disabled
					className="border-t-0 pt-0"
				>
					<ImageTransformControl
						value={imageTransform}
						aspectRatio={canvasAspectRatio}
						onChange={setImageTransform}
					/>
				</Controller.Group>
			)}
		</>
	)
}
