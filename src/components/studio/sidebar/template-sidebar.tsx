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
	const { navigation, config, text, images, vectors, layers, background, focus } =
		useTemplateStudio()
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
	const backgroundDimmerControl = backgroundSlot
		? findTemplateControl(config, backgroundSlot.dimmerControlId)
		: undefined
	const backgroundDimmerOpacityControl = backgroundSlot
		? findTemplateControl(config, backgroundSlot.dimmerOpacityControlId)
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
							{exporting.scaleApplies && (
								<ScaleControls
									scale={exporting.scale}
									options={exporting.scaleOptions}
									onChange={exporting.setScale}
								/>
							)}
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
								<div
									key={slot.id}
									className="flex flex-col gap-1"
									{...slotFocusProps(focus, slot.id)}
								>
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
						<Controller.Group
							key={slot.id}
							title={sectionTitle}
							collapsible
							{...slotFocusProps(focus, slot.id)}
							{...slotSectionProps(focus, slot.id)}
						>
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
								onActivate={() => focus.set(slot.id)}
							/>
							{/* 디자인 SSOT(1:1838): Image Transform은 구분선 없는 섹션이다. 대상 슬롯에 종속되므로
						    슬롯 그룹 안에 두고 함께 접는다. 생성 전에는 닫힌 채 잠긴다 — compose가 배정된
						    이미지에만 transform을 적용해서다. */}
							{slot.transform.enabled && (
								<Controller.Group
									title={`${sectionTitle} Transform`}
									collapsible
									attached
									onActivate={() => focus.set(slot.id)}
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
						<Controller.Group
							key={slot.id}
							title={slot.label}
							collapsible
							{...slotFocusProps(focus, slot.id)}
							{...slotSectionProps(focus, slot.id)}
						>
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
							dimmerDefinition={
								backgroundDimmerControl?.kind === 'toggle'
									? backgroundDimmerControl
									: undefined
							}
							dimmerOpacityDefinition={
								backgroundDimmerOpacityControl?.kind === 'range'
									? backgroundDimmerOpacityControl
									: undefined
							}
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

/**
 * 슬롯 하나를 「지금 만지는 것」으로 캔버스에 알리는 핸들러.
 *
 * 🔑 그룹 래퍼에 capture로 단다 — 안쪽 컨트롤이 몇 개든(Transform 하위 그룹까지) 한 자리에서
 *    잡히고, 컨트롤마다 배선을 더할 필요가 없다.
 * ponytail: 포커스만 본다. hover도 켜면 「마우스는 나갔지만 포커스는 남아 있다」를 가르는 조건이
 *   필요해지고(활성 요소 포함 검사) 얻는 것은 발견성뿐이다 — 필요해지면 `onPointerEnter`와
 *   `contains(document.activeElement)` 가드 두 줄이다.
 */
function slotFocusProps(focus: ReturnType<typeof useTemplateStudio>['focus'], slotId: string) {
	return {
		onFocusCapture: () => focus.set(slotId),
		// 🔴 내 것일 때만 놓는다 — 다른 슬롯으로 곧장 옮겨 가면 새 focus가 먼저 들어온다.
		onBlurCapture: () => {
			if (focus.slotId === slotId) focus.set(null)
		},
	}
}

/**
 * 슬롯 섹션의 활성 표시와 활성화 클릭.
 *
 * 🔑 `onActivate`를 주는 것 자체가 「chevron만 접기 트리거」 모드를 켠다(`Controller.Group`의 계약).
 *    그래서 섹션 안 아무 곳을 눌러도 그 섹션이 켜지고, 접기는 화살표에서만 일어난다.
 * 🔴 하위 섹션(Profile Settings·Transform)에는 `active`를 주지 않는다 — 면을 두 겹 칠하면 경계가
 *    오히려 흐려진다. 대신 `onActivate`만 줘서 한 패널 안에서 토글 규칙이 갈리지 않게 한다.
 */
function slotSectionProps(focus: ReturnType<typeof useTemplateStudio>['focus'], slotId: string) {
	return { active: focus.slotId === slotId, onActivate: () => focus.set(slotId) }
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
