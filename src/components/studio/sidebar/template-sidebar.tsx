'use client'

import { Controller } from '@/components/shared/controller'
import {
	CONTROLLER_TOGGLE_OPTIONS,
	ControllerControlRenderer,
	ControllerGroupRenderer,
} from '@/components/shared/controller-renderer'
import { browseEmptyMessage } from '@/components/studio/shared/browse-status'
import {
	ExportAction,
	PrintControls,
	ScaleControls,
	VideoControls,
} from '@/components/studio/shared/output-controls'
import { StudioSidebar } from '@/components/studio/sidebar/studio-sidebar'
import { BackgroundSection } from '@/components/studio/template/background-section'
import { ImageSlotInput } from '@/components/studio/template/image-slot-input'
import {
	IMAGE_TRANSFORM_DEFAULT,
	ImageTransformControl,
} from '@/components/studio/template/image-transform-control'
import { TemplateProfilePicker } from '@/components/studio/template/template-profile-picker'
import { TextSlotInput } from '@/components/studio/template/text-slot-input'
import { Typography } from '@/components/ui/typography'
import {
	STUDIO_OUTPUT_FORMAT_OPTIONS,
	type StudioOutputFormat,
} from '@/features/studio-export/export-contract'
import type { TemplateExportView } from '@/features/studio-export/hooks/use-template-export'
import {
	findTemplateControl,
	findTemplateControlGroup,
	partitionTemplateSlots,
} from '@/features/template-customization/domain/template-studio-config'
import { useTemplateStudio } from '@/features/template-customization/hooks/use-template-studio'

const FORMAT_LABELS = new Map(
	STUDIO_OUTPUT_FORMAT_OPTIONS.map(({ label, value }) => [value, label]),
)

/**
 * 템플릿 스튜디오의 사이드바(컨트롤러 패널) — 캔버스를 모른다.
 * 무엇을 그릴지는 편집 계약(config)만 보고 결정하고(원시 nodeConfigs 참조 금지),
 * 세션 값은 컨텍스트의 text/images 그룹으로만 읽고 쓴다.
 */
export function TemplateSidebar({ exporting }: { exporting: TemplateExportView }) {
	const { navigation, config, text, images, vectors, layers, background } = useTemplateStudio()
	const {
		text: textSlots,
		image: imageSlots,
		background: backgroundSlot,
	} = partitionTemplateSlots(config.template.slots)
	const { canvas } = config.template.exportOption
	const video = exporting.format === 'mp4' ? config.output.video?.mp4 : undefined
	const backgroundTypeControl = backgroundSlot
		? findTemplateControl(config, backgroundSlot.typeControlId)
		: undefined
	const backgroundColorControl = backgroundSlot
		? findTemplateControl(config, backgroundSlot.colorControlId)
		: undefined
	const backgroundGroup = backgroundSlot
		? findTemplateControlGroup(config, backgroundSlot.typeControlId)
		: undefined
	const textGroup = textSlots[0]
		? findTemplateControlGroup(config, textSlots[0].controlId)
		: undefined
	const textColorControl = config.template.textColorControlId
		? findTemplateControl(config, config.template.textColorControlId)
		: undefined
	const templateCount = (navigation.browse.data ?? []).reduce(
		(total, category) => total + category.templates.length,
		0,
	)

	return (
		// 자산 브라우저의 열림은 편집 세션이 아니라 이 화면의 표현 상태다 — 킷이 소유한다(Provider에 넣지 않는다).
		<Controller.Browser.Root>
			<StudioSidebar
				header={
					<Controller.AssetCard
						title={config.name}
						subtitle={navigation.categoryTitle ?? undefined}
						buttonLabel="Change"
						aria-label="템플릿 변경"
						tabs={['Templates']}
						previewImage={config.previewImage}
						empty={browseEmptyMessage(
							navigation.browse.status,
							templateCount > 1,
							'교체할 다른 템플릿이 없습니다.',
						)}
						className="min-h-32 items-start"
					>
						<TemplateProfilePicker />
					</Controller.AssetCard>
				}
				footer={
					<>
						<div className="flex flex-col gap-1">
							<div className="flex h-9 items-center pt-1">
								<span className="text-sm font-semibold text-muted-foreground">
									Setting
								</span>
							</div>
							<Controller.Row label="Size" readonly>
								<span className="text-sm text-muted-foreground">
									{exporting.outputSize?.width ?? canvas.width} ×{' '}
									{exporting.outputSize?.height ?? canvas.height}px
								</span>
							</Controller.Row>
							<ScaleControls
								scale={exporting.scale}
								options={exporting.scaleOptions}
								onChange={exporting.setScale}
							/>
							<Controller.Row label="Format">
								<Controller.Select
									options={exporting.formats.map((candidate) => ({
										value: candidate,
										label: FORMAT_LABELS.get(candidate) ?? candidate,
									}))}
									value={exporting.format ?? ''}
									onChange={(value) =>
										exporting.setFormat(value as StudioOutputFormat)
									}
								/>
							</Controller.Row>
							{(exporting.format === 'tiff' || exporting.format === 'pdf') &&
								exporting.ppi &&
								config.output.print && (
									<PrintControls
										ppi={exporting.ppi}
										options={config.output.print.ppi}
										onChange={exporting.setPpi}
									/>
								)}
							{video && exporting.fps && (
								<VideoControls
									fps={exporting.fps}
									fpsOptions={video.fps}
									durationSeconds={exporting.durationSeconds}
									maxDurationSeconds={video.maxDurationSeconds}
									onFpsChange={exporting.setFps}
									onDurationChange={exporting.setDuration}
								/>
							)}
						</div>
						<ExportAction
							busy={exporting.busy}
							disabled={!exporting.canExport}
							error={exporting.error}
							onExport={exporting.run}
						/>
					</>
				}
			>
				{textSlots.length > 0 && textGroup && (
					<ControllerGroupRenderer
						definition={textGroup}
						presentation={config.controllerPresentation?.groups.find(
							({ groupId }) => groupId === textGroup.id,
						)}
					>
						{textSlots.map((slot) => {
							const definition = findTemplateControl(config, slot.controlId)
							if (definition?.kind !== 'text') return null
							return (
								<div key={slot.id} className="flex flex-col gap-1">
									<LayerVisibilityControl
										label={slot.label}
										visible={layers.visibility[slot.id] ?? true}
										allowToggle={slot.visibility.allowToggle}
										onChange={(visible) => layers.setVisible(slot.id, visible)}
									/>
									<TextSlotInput
										definition={definition}
										input={slot.input}
										value={
											text.values[slot.id] ?? definition.defaultValue ?? ''
										}
										onChange={(next) => text.setValue(slot.id, next)}
									/>
									{text.clippedSlotIds.has(slot.id) && (
										<Typography role="status" size="xs" tone="muted">
											입력한 텍스트가 박스를 넘어 일부가 잘려 보여요.
										</Typography>
									)}
								</div>
							)
						})}
						{textColorControl?.kind === 'color' && (
							<ControllerControlRenderer
								definition={textColorControl}
								value={text.color}
								onChange={(next) => {
									if (typeof next === 'string' || next === null)
										text.setColor(next)
								}}
							/>
						)}
					</ControllerGroupRenderer>
				)}
				{imageSlots.map((slot, index) => {
					const sectionTitle = imageSlots.length > 1 ? `Image ${index + 1}` : 'Image'
					const state = images.states[slot.id]
					const contracts = images.contracts[slot.id] ?? []
					if (!state) return null
					return (
						<Controller.Group key={slot.id} title={sectionTitle} collapsible>
							<LayerVisibilityControl
								label={slot.label}
								visible={layers.visibility[slot.id] ?? true}
								allowToggle={slot.visibility.allowToggle}
								onChange={(visible) => layers.setVisible(slot.id, visible)}
							/>
							<ImageSlotInput
								pinned={slot.imageConfig.mode === 'pinned'}
								readonly={slot.access === 'readonly'}
								contracts={contracts}
								value={state}
								onFeatureChange={(controlId, next) =>
									images.updateFeature(slot.id, controlId, next)
								}
								onProfileChange={(profileId) =>
									images.selectProfile(slot.id, profileId)
								}
								onPromptChange={(prompt) => images.update(slot.id, { prompt })}
								onImageModeChange={(imageMode) =>
									images.update(slot.id, { imageMode })
								}
								onSelectSampleImage={(option) =>
									images.selectSampleImage(slot.id, option)
								}
								onGenerate={() => images.generate(slot.id)}
							/>
							{/* 디자인 SSOT(1:1838): Image Transform은 구분선 없는 섹션이다. 대상 슬롯에 종속되므로
						    슬롯 그룹 안에 두고 함께 접는다. 생성 전에는 닫힌 채 잠긴다 — compose가 배정된
						    이미지에만 transform을 적용해서다. */}
							{slot.transform.enabled && (
								<Controller.Group
									title={`${sectionTitle} Transform`}
									collapsible
									attached
									disabled={slot.access === 'readonly' || !state?.image}
								>
									<ImageTransformControl
										value={state?.transform ?? IMAGE_TRANSFORM_DEFAULT}
										// compose는 배정된 이미지에만 transform을 적용한다 — 생성 전에는 비활성.
										disabled={slot.access === 'readonly' || !state?.image}
										limits={slot.transform.limits}
										// 패드는 대상 슬롯 박스와 같은 비율로 그려진다(디자인 Wide/Portrait/Square).
										aspectRatio={
											slot.box.width && slot.box.height
												? slot.box.width / slot.box.height
												: undefined
										}
										onChange={(transform) =>
											images.update(slot.id, { transform })
										}
									/>
								</Controller.Group>
							)}
						</Controller.Group>
					)
				})}
				{vectors.slots.map((slot) => {
					const color = vectors.colors[slot.id]
					return (
						<Controller.Group key={slot.id} title={slot.label} collapsible>
							<LayerVisibilityControl
								label={slot.label}
								visible={layers.visibility[slot.id] ?? true}
								allowToggle={slot.visibility.allowToggle}
								onChange={(visible) => layers.setVisible(slot.id, visible)}
							/>
							<Controller.ColorRow
								label="Color"
								value={color ?? '#000000'}
								isEmpty={!color}
								disabled={slot.access === 'readonly'}
								onChange={(next) => vectors.setColor(slot.id, next)}
							/>
						</Controller.Group>
					)
				})}
				{backgroundSlot &&
					backgroundGroup &&
					backgroundTypeControl?.kind === 'select' &&
					backgroundColorControl?.kind === 'color' && (
						<BackgroundSection
							groupDefinition={backgroundGroup}
							groupPresentation={config.controllerPresentation?.groups.find(
								({ groupId }) => groupId === backgroundGroup.id,
							)}
							typeDefinition={backgroundTypeControl}
							colorDefinition={backgroundColorControl}
							canvasAspectRatio={
								canvas.width && canvas.height
									? canvas.width / canvas.height
									: undefined
							}
							imageContracts={background.contracts}
							featureBindings={background.featureBindings}
							graphicConfigs={background.graphicConfigs}
							graphicBindings={background.graphicBindings}
							value={background.state}
							onChange={background.update}
							onColorChange={(next) => {
								if (typeof next === 'string' || next === null)
									background.setColor(next)
							}}
							onTypeChange={background.selectType}
							onFeatureChange={background.updateFeature}
							onImageProfileChange={background.selectImageProfile}
							onSelectSampleImage={background.selectSampleImage}
							onGraphicConfigChange={background.selectGraphicConfig}
							onGraphicChange={background.updateGraphic}
							onGenerate={background.generate}
						/>
					)}
				{textSlots.length === 0 &&
					imageSlots.length === 0 &&
					vectors.slots.length === 0 && (
						<Typography size="sm" tone="muted">
							이 템플릿에는 편집 가능한 슬롯이 없습니다.
						</Typography>
					)}
			</StudioSidebar>
		</Controller.Browser.Root>
	)
}

function LayerVisibilityControl({
	label,
	visible,
	allowToggle,
	onChange,
}: {
	label: string
	visible: boolean
	allowToggle: boolean
	onChange: (visible: boolean) => void
}) {
	if (!allowToggle) return null
	return (
		<Controller.Row label={`${label} 표시`}>
			<Controller.Segmented
				aria-label={`${label} 표시`}
				options={CONTROLLER_TOGGLE_OPTIONS}
				value={visible ? 'on' : 'off'}
				onChange={(next) => onChange(next === 'on')}
			/>
		</Controller.Row>
	)
}
