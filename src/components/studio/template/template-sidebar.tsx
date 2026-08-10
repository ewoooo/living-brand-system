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
 * 편집 상태는 전부 TemplateStudioProvider 컨텍스트로만 읽고 쓴다.
 */
export function TemplateSidebar() {
	const router = useRouter()
	const { template, navigation, text, images, canvas, exporting } = useTemplateStudio()
	const currentCategory = navigation.categories.find((category) =>
		category.templates.some((item) => item.id === template.id),
	)
	const selectedTemplateHref =
		currentCategory?.templates.find((item) => item.id === template.id)?.href ?? ''

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
								{template.printPpi
									? `${pixelsToMillimeters(canvas.width, template.printPpi).toFixed(1)} × ${pixelsToMillimeters(canvas.height, template.printPpi).toFixed(1)}mm`
									: `${canvas.width} × ${canvas.height}px`}
							</span>
						</Controller.Row>
						{template.printPpi && (
							<Controller.Row label="Resolution" readonly>
								<span className="text-sm text-muted-foreground">
									{template.printPpi}ppi
								</span>
							</Controller.Row>
						)}
						{template.printPpi && (
							<Controller.Row label="Color Profile" readonly>
								<span className="text-sm text-muted-foreground">CMYK</span>
							</Controller.Row>
						)}
						<Controller.Row label="Format">
							<Controller.Select
								options={exporting.availableFormats.map((candidate) => ({
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
						{template.name}
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

			{text.slots.length > 0 && (
				<Controller.Section title="Text">
					{text.slots.map((slot) => (
						<div key={slot.nodeId} className="flex flex-col gap-1">
							<TextSlotInput
								label={slot.input.label ?? slot.name}
								spec={slot.input}
								value={text.values[slot.nodeId] ?? slot.text}
								onChange={(next) => text.setValue(slot.nodeId, next)}
							/>
							{text.clippedSlotIds.has(slot.nodeId) && (
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
			{images.slots.map((slot, index) => {
				const sectionTitle = images.slots.length > 1 ? `Image ${index + 1}` : 'Image'
				const state = images.states[slot.nodeId]
				const nodeConfig = template.nodeConfigs[slot.nodeId]
				return (
					<div key={slot.nodeId} className="flex flex-col gap-3">
						<Controller.Section title={sectionTitle}>
							<ImageSlotInput
								pinnedProfileId={slot.profileId}
								profiles={images.profiles}
								profilesFailed={images.profilesFailed}
								colorizeEnabled={Boolean(nodeConfig?.imageColorize)}
								aspectRatio={nearestImageAspectRatio(
									slot.boxWidth ?? Number.NaN,
									slot.boxHeight ?? Number.NaN,
								)}
								lineColor={
									state?.lineColor ?? nodeConfig?.imageColorize?.line ?? '#000000'
								}
								onLineColorChange={(hex) =>
									images.update(slot.nodeId, { lineColor: hex })
								}
								onGenerated={(image) => images.update(slot.nodeId, { image })}
							/>
						</Controller.Section>
						{/* 디자인 SSOT(1:1838): Image Transform은 구분선 없는 별도 섹션이다.
						    생성 전에는 닫힌 채 잠긴다 — compose가 배정된 이미지에만 transform을 적용해서다. */}
						<Controller.Section
							title={`${sectionTitle} Transform`}
							className="border-t-0 pt-0"
							disabled={!state?.image}
						>
							<ImageTransformControl
								value={state?.transform ?? IMAGE_TRANSFORM_DEFAULT}
								// compose는 배정된 이미지에만 transform을 적용한다 — 생성 전에는 비활성.
								disabled={!state?.image}
								// 패드는 대상 슬롯 박스와 같은 비율로 그려진다(디자인 Wide/Portrait/Square).
								aspectRatio={
									slot.boxWidth && slot.boxHeight
										? slot.boxWidth / slot.boxHeight
										: undefined
								}
								onChange={(transform) => images.update(slot.nodeId, { transform })}
							/>
						</Controller.Section>
					</div>
				)
			})}
			<BackgroundSection
				canvasAspectRatio={
					canvas.width && canvas.height ? canvas.width / canvas.height : undefined
				}
			/>
			{text.slots.length === 0 && images.slots.length === 0 && (
				<Typography size="sm" tone="muted">
					이 템플릿에는 편집 가능한 슬롯이 없습니다.
				</Typography>
			)}
		</Controller.Panel>
	)
}
