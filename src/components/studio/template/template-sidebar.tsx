'use client'

import { useRouter } from 'next/navigation'
import { Controller } from '@/components/studio/shared/controller'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
} from '@/components/ui/select'
import { Typography } from '@/components/ui/typography'
import { nearestImageAspectRatio } from '@/features/generate-image/image-size'
import { pixelsToMillimeters } from '@/features/template-export/print-policy'
import type { TemplateExportFormat } from '@/features/template-export/services/export-template.client'
import { useTemplateStudio } from '@/features/template-studio/hooks/use-template-studio'
import {
	isBackgroundSlot,
	isImageSlot,
	isTextSlot,
} from '@/features/template-studio/template-config'
import { BackgroundSection } from './background-section'
import { ImageSlotInput } from './image-slot-input'
import { IMAGE_TRANSFORM_DEFAULT, ImageTransformControl } from './image-transform-control'
import { TextSlotInput } from './text-slot-input'

const FORMAT_LABELS: Record<TemplateExportFormat, string> = {
	png: 'PNG',
	tiff: 'CMYK TIFF',
	pdf: 'CMYK PDF',
}

/**
 * 템플릿 스튜디오의 사이드바(컨트롤러 패널) — 캔버스를 모른다.
 * 무엇을 그릴지는 편집 계약(config)만 보고 결정하고(원시 nodeConfigs 참조 금지),
 * 세션 값은 컨텍스트의 text/images 그룹으로만 읽고 쓴다.
 */
export function TemplateSidebar() {
	const router = useRouter()
	const { navigation, config, text, images, background, exporting } = useTemplateStudio()
	const textSlots = config.slots.filter(isTextSlot)
	const imageSlots = config.slots.filter(isImageSlot)
	const backgroundSlot = config.slots.find(isBackgroundSlot)
	const { canvas, printPpi } = config.exportOption
	const currentCategory = navigation.categories.find((category) =>
		category.templates.some((item) => item.id === config.id),
	)
	const selectedTemplateHref =
		currentCategory?.templates.find((item) => item.id === config.id)?.href ?? ''

	return (
		<Controller.Panel
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
								{printPpi
									? `${pixelsToMillimeters(canvas.width, printPpi).toFixed(1)} × ${pixelsToMillimeters(canvas.height, printPpi).toFixed(1)}mm`
									: `${canvas.width} × ${canvas.height}px`}
							</span>
						</Controller.Row>
						{printPpi && (
							<Controller.Row label="Resolution" readonly>
								<span className="text-sm text-muted-foreground">{printPpi}ppi</span>
							</Controller.Row>
						)}
						{printPpi && (
							<Controller.Row label="Color Profile" readonly>
								<span className="text-sm text-muted-foreground">CMYK</span>
							</Controller.Row>
						)}
						<Controller.Row label="Format">
							<Controller.Select
								options={config.exportOption.formats.map((candidate) => ({
									value: candidate,
									label: FORMAT_LABELS[candidate],
								}))}
								value={exporting.format}
								onChange={(value) =>
									exporting.setFormat(value as TemplateExportFormat)
								}
							/>
						</Controller.Row>
					</div>
					<div className="flex flex-col gap-2">
						<Button
							className="h-11 w-full"
							onClick={() => exporting.run(exporting.format)}
							disabled={exporting.busy}
						>
							{exporting.busy ? '내보내는 중...' : '내보내기'}
						</Button>
						{exporting.error && (
							<Typography role="alert" size="sm" className="text-destructive">
								{exporting.error}
							</Typography>
						)}
					</div>
				</>
			}
		>
			<div
				data-slot="template-identity-card"
				className="flex h-32 shrink-0 items-start justify-between gap-3 rounded-md bg-foreground p-4 text-background"
			>
				<div className="flex min-w-0 flex-col">
					<Typography as="p" weight="medium" className="truncate">
						{config.name}
					</Typography>
					{currentCategory && (
						<Typography as="p" size="xs" className="truncate text-background/60">
							{currentCategory.title}
						</Typography>
					)}
				</div>
				<Select value={selectedTemplateHref} onValueChange={(value) => router.push(value)}>
					<SelectTrigger
						aria-label="템플릿 변경"
						className="h-auto w-fit shrink-0 gap-0 rounded-lg border-transparent bg-background/25 px-2.5 py-1 text-xs font-medium text-background hover:bg-background/35 dark:bg-background/25 [&_svg]:hidden"
					>
						Change
					</SelectTrigger>
					<SelectContent align="end">
						{navigation.categories.map(
							(category) =>
								category.templates.length > 0 && (
									<SelectGroup key={category.id}>
										<SelectLabel>{category.title}</SelectLabel>
										{category.templates.map((item) => (
											<SelectItem key={item.id} value={item.href}>
												{item.name}
											</SelectItem>
										))}
									</SelectGroup>
								),
						)}
					</SelectContent>
				</Select>
			</div>

			{textSlots.length > 0 && (
				<Controller.Section title="Text">
					{textSlots.map((slot) => (
						<div key={slot.id} className="flex flex-col gap-1">
							<TextSlotInput
								label={slot.label}
								control={slot.control}
								value={text.values[slot.id] ?? slot.control.defaultValue}
								onChange={(next) => text.setValue(slot.id, next)}
							/>
							{text.clippedSlotIds.has(slot.id) && (
								<Typography role="status" size="xs" tone="muted">
									입력한 텍스트가 박스를 넘어 일부가 잘려 보여요.
								</Typography>
							)}
						</div>
					))}
					<Controller.ColorRow
						label="Color"
						value={text.color ?? '#000000'}
						isEmpty={text.color === null}
						onReset={() => text.setColor(null)}
						onChange={text.setColor}
					/>
				</Controller.Section>
			)}
			{imageSlots.map((slot, index) => {
				const sectionTitle = imageSlots.length > 1 ? `Image ${index + 1}` : 'Image'
				const control = slot.control
				const state = images.states[slot.id]
				return (
					<div key={slot.id} className="flex flex-col gap-3">
						<Controller.Section title={sectionTitle}>
							<ImageSlotInput
								pinnedProfileId={control.profile.pinnedId}
								profiles={images.profiles}
								profilesFailed={images.profilesFailed}
								colorizeEnabled={Boolean(control.colorize)}
								aspectRatio={nearestImageAspectRatio(
									control.box.width ?? Number.NaN,
									control.box.height ?? Number.NaN,
								)}
								lineColor={state?.lineColor ?? control.colorize?.line ?? '#000000'}
								onLineColorChange={(hex) =>
									images.update(slot.id, { lineColor: hex })
								}
								onGenerated={(image) => images.update(slot.id, { image })}
							/>
						</Controller.Section>
						{/* 디자인 SSOT(1:1838): Image Transform은 구분선 없는 별도 섹션이다.
						    생성 전에는 닫힌 채 잠긴다 — compose가 배정된 이미지에만 transform을 적용해서다. */}
						{control.transform.enabled && (
							<Controller.Section
								title={`${sectionTitle} Transform`}
								className="border-t-0 pt-0"
								disabled={!state?.image}
							>
								<ImageTransformControl
									value={state?.transform ?? IMAGE_TRANSFORM_DEFAULT}
									// compose는 배정된 이미지에만 transform을 적용한다 — 생성 전에는 비활성.
									disabled={!state?.image}
									limits={control.transform.limits}
									// 패드는 대상 슬롯 박스와 같은 비율로 그려진다(디자인 Wide/Portrait/Square).
									aspectRatio={
										control.box.width && control.box.height
											? control.box.width / control.box.height
											: undefined
									}
									onChange={(transform) => images.update(slot.id, { transform })}
								/>
							</Controller.Section>
						)}
					</div>
				)
			})}
			{backgroundSlot && (
				<BackgroundSection
					allowedTypes={backgroundSlot.control.allowedTypes}
					canvasAspectRatio={
						canvas.width && canvas.height ? canvas.width / canvas.height : undefined
					}
					// 생성 비율은 조작 대상(캔버스)에서 파생한다 — 이미지 슬롯이 박스에서 파생하는 것과 같다.
					aspectRatio={nearestImageAspectRatio(canvas.width, canvas.height)}
					profiles={images.profiles}
					profilesFailed={images.profilesFailed}
					value={background.state}
					onChange={background.update}
				/>
			)}
			{textSlots.length === 0 && imageSlots.length === 0 && (
				<Typography size="sm" tone="muted">
					이 템플릿에는 편집 가능한 슬롯이 없습니다.
				</Typography>
			)}
		</Controller.Panel>
	)
}
