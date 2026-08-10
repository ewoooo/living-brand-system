'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
	InspectorColorRow,
	InspectorPanel,
	InspectorRow,
	InspectorSection,
} from '@/components/studio/shared/inspector'
import { StudioWorkspace } from '@/components/studio/shared/studio-workspace'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Typography } from '@/components/ui/typography'
import { nearestImageAspectRatio } from '@/features/generate-image/image-size'
import { useTemplateExport } from '@/features/template-export/hooks/use-template-export'
import { pixelsToMillimeters } from '@/features/template-export/print-policy'
import type { TemplateExportFormat } from '@/features/template-export/services/export-template.client'
import {
	collectTemplateImageSlots,
	collectTemplateSlots,
} from '@/services/collect-template-slots.service'
import { composeTemplateHtml } from '@/services/compose-template-html.client'
import type { GetCreateNavigationOutput } from '@/services/get-create-navigation.service'
import type { PublishedHtmlTemplate } from '@/services/get-published-template.service'
import { BackgroundSection } from './background-section'
import { ImageSlotInput } from './image-slot-input'
import {
	IMAGE_TRANSFORM_DEFAULT,
	ImageTransformControl,
	type ImageTransformValue,
	toImageEditTransform,
} from './image-transform-control'
import { TextSlotInput } from './text-slot-input'

const PREVIEW_WIDTH = 480

const FORMAT_LABELS: Record<TemplateExportFormat, string> = {
	png: 'PNG',
	tiff: 'CMYK TIFF',
	pdf: 'CMYK PDF',
}

type TemplateGeneratorProps = {
	navigation: GetCreateNavigationOutput
	template: PublishedHtmlTemplate
}

/**
 * Figma에서 가져온 published HTML의 열린 슬롯(input이 달린 텍스트 노드,
 * imageInput이 달린 프레임 이미지 슬롯)을 편집해
 * 미리보기 그대로 PNG·운영자 정책의 CMYK TIFF 또는 mm 단위 CMYK PDF로 내보낸다. 서버 상태 변경은 없다 —
 * 입력값은 로컬 state로만 합성한다.
 * 컨트롤러는 디자인 SSOT(Figma HD_LBS_UI 1:14)의 인스펙터 패널 구조를 따른다.
 * 미리보기는 동일-문서 렌더(어드민 캔버스는 same-origin iframe) — opaque origin iframe은 벡터 mask의
 * CORS 로드를 깨뜨린다. 임포트 HTML은 스크립트 없는 inline-style이다.
 */
export function TemplateGenerator({ navigation, template }: TemplateGeneratorProps) {
	const router = useRouter()
	const previewRef = useRef<HTMLDivElement>(null)
	const [values, setValues] = useState<Record<string, string>>({})
	const [clippedSlotIds, setClippedSlotIds] = useState<ReadonlySet<string>>(new Set())
	const [imageValues, setImageValues] = useState<
		Record<string, { backgroundImage: string; generatedImageId: number }>
	>({})
	const [format, setFormat] = useState<TemplateExportFormat>('png')
	// null = 사용자가 만지지 않음 — 저작 텍스트 색을 그대로 둔다(일괄 검정으로 덮지 않도록).
	const [textColor, setTextColor] = useState<string | null>(null)
	const [lineColors, setLineColors] = useState<Record<string, string>>({})
	const [imageTransforms, setImageTransforms] = useState<Record<string, ImageTransformValue>>({})
	const { html, nodeConfigs, width, height } = template
	const scale = Math.min(1, PREVIEW_WIDTH / width)
	const currentCategory = navigation.categories.find((category) =>
		category.templates.some((item) => item.id === template.id),
	)
	const selectedTemplateHref =
		currentCategory?.templates.find((item) => item.id === template.id)?.href ?? ''

	const slots = useMemo(() => collectTemplateSlots(html, nodeConfigs), [html, nodeConfigs])
	const imageSlots = useMemo(
		() => collectTemplateImageSlots(html, nodeConfigs),
		[html, nodeConfigs],
	)

	// 사용자가 만진 슬롯만 오버라이드로 합성한다(만지지 않은 슬롯은 저작 값 유지).
	// 텍스트 슬롯(<p>)과 이미지 슬롯(프레임)은 노드가 겹치지 않아 그대로 합친다.
	// 일괄 텍스트 색은 사용자가 만졌을 때만 모든 텍스트 슬롯에 싣는다.
	// 이미지 교체에는 저작 config의 imageColorize를 깔아 재적용하고(published html의 옛 colorize
	// 오버레이는 compose가 멱등 제거), 사용자가 Line Color를 바꿨으면 그 line만 갈아끼운다.
	// 사용자 imageTransform은 생성 이미지가 있는 슬롯에만 싣는다 — compose는 매번 published html
	// (불변 base)에서 새로 합성하므로 어드민과 같은 base-재합성 패턴이라 prepend가 누적되지 않는다.
	const composedHtml = useMemo(() => {
		const textOverrides = Object.fromEntries(
			slots
				.map((slot) => {
					const override: { text?: string; color?: string } = {}
					const text = values[slot.nodeId]
					if (text !== undefined) override.text = text
					if (textColor) override.color = textColor
					return [slot.nodeId, override] as const
				})
				.filter(([, override]) => Object.keys(override).length > 0),
		)
		const imageOverrides = Object.fromEntries(
			Object.entries(imageValues).map(([nodeId, imageValue]) => {
				const colorize = nodeConfigs[nodeId]?.imageColorize
				const userLine = lineColors[nodeId]
				const transform = imageTransforms[nodeId]
				const slot = imageSlots.find((candidate) => candidate.nodeId === nodeId)
				return [
					nodeId,
					{
						...(colorize
							? {
									imageColorize: userLine
										? { ...colorize, line: userLine }
										: colorize,
								}
							: {}),
						...(transform
							? {
									imageTransform: toImageEditTransform(
										transform,
										slot?.boxWidth ?? width,
										slot?.boxHeight ?? height,
									),
								}
							: {}),
						...imageValue,
					},
				]
			}),
		)
		return composeTemplateHtml(html, { ...textOverrides, ...imageOverrides })
	}, [
		html,
		slots,
		values,
		textColor,
		imageValues,
		lineColors,
		imageTransforms,
		imageSlots,
		nodeConfigs,
		width,
		height,
	])
	// 합성 결과가 그려진 뒤 텍스트 슬롯의 실제 렌더 박스를 재서 잘림을 알린다 —
	// scrollHeight는 overflow:hidden clip과 -webkit-line-clamp 말줄임 양쪽에서 잘린 내용까지 세고,
	// 미리보기 축소(transform scale)는 이 두 값에 영향을 주지 않는다.
	// biome-ignore lint/correctness/useExhaustiveDependencies(composedHtml): 측정 대상 DOM이 composedHtml로 그려진다 — 값 참조는 없지만 합성이 바뀔 때마다 다시 재야 한다
	useEffect(() => {
		const container = previewRef.current
		if (!container) return
		const clipped = new Set<string>()
		for (const slot of slots) {
			const element = container.querySelector(`[data-node-id="${slot.nodeId}"]`)
			if (element && element.scrollHeight > element.clientHeight + 1) clipped.add(slot.nodeId)
		}
		setClippedSlotIds(clipped)
	}, [composedHtml, slots])

	const { canExport, exporting, exportError, exportTemplate } = useTemplateExport({
		fileName: template.name,
		height,
		html: composedHtml,
		printPpi: template.printPpi,
		templateId: template.id,
		templateVersion: template.templateVersion,
		width,
	})
	const availableFormats = (['png', 'tiff', 'pdf'] as const).filter(
		(candidate) => candidate === 'png' || canExport(candidate),
	)

	return (
		<StudioWorkspace
			controller={
				<InspectorPanel
					footer={
						<>
							<div className="flex flex-col gap-1">
								<div className="flex h-9 items-center pt-1">
									<span className="text-sm font-semibold text-muted-foreground">
										Setting
									</span>
								</div>
								<InspectorRow label="Size" className="opacity-50">
									<span className="text-sm text-muted-foreground">
										{template.printPpi
											? `${pixelsToMillimeters(width, template.printPpi).toFixed(1)} × ${pixelsToMillimeters(height, template.printPpi).toFixed(1)}mm`
											: `${width} × ${height}px`}
									</span>
								</InspectorRow>
								{template.printPpi && (
									<InspectorRow label="Resolution" className="opacity-50">
										<span className="text-sm text-muted-foreground">
											{template.printPpi}ppi
										</span>
									</InspectorRow>
								)}
								{template.printPpi && (
									<InspectorRow label="Color Profile" className="opacity-50">
										<span className="text-sm text-muted-foreground">CMYK</span>
									</InspectorRow>
								)}
								<InspectorRow label="Format" htmlFor="export-format">
									<Select
										value={format}
										onValueChange={(value) =>
											setFormat(value as TemplateExportFormat)
										}
									>
										<SelectTrigger
											id="export-format"
											size="sm"
											className="h-auto border-transparent bg-transparent p-0 text-muted-foreground focus-visible:ring-0 dark:bg-transparent"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent align="end">
											{availableFormats.map((candidate) => (
												<SelectItem key={candidate} value={candidate}>
													{FORMAT_LABELS[candidate]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</InspectorRow>
							</div>
							<div className="flex flex-col gap-2">
								<Button
									className="h-11 w-full"
									onClick={() => exportTemplate(format)}
									disabled={exporting !== null}
								>
									{exporting !== null ? '내보내는 중...' : '내보내기'}
								</Button>
								{exportError && (
									<Typography role="alert" size="sm" className="text-destructive">
										{exportError}
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
								<Typography
									as="p"
									size="xs"
									className="truncate text-background/60"
								>
									{currentCategory.title}
								</Typography>
							)}
						</div>
						<Select
							value={selectedTemplateHref}
							onValueChange={(value) => router.push(value)}
						>
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

					{slots.length > 0 && (
						<InspectorSection title="Text">
							{slots.map((slot) => (
								<div key={slot.nodeId} className="flex flex-col gap-1">
									<TextSlotInput
										id={`slot-${slot.nodeId}`}
										label={slot.input.label ?? slot.name}
										spec={slot.input}
										value={values[slot.nodeId] ?? slot.text}
										onChange={(text) =>
											setValues((current) => ({
												...current,
												[slot.nodeId]: text,
											}))
										}
									/>
									{clippedSlotIds.has(slot.nodeId) && (
										<Typography role="status" size="xs" tone="muted">
											입력한 텍스트가 박스를 넘어 일부가 잘려 보여요.
										</Typography>
									)}
								</div>
							))}
							<InspectorColorRow
								label="Color"
								value={textColor ?? '#000000'}
								onChange={setTextColor}
							/>
						</InspectorSection>
					)}
					{imageSlots.map((slot, index) => {
						const sectionTitle = imageSlots.length > 1 ? `Image ${index + 1}` : 'Image'
						return (
							<div key={slot.nodeId} className="flex flex-col gap-3">
								<InspectorSection title={sectionTitle}>
									<ImageSlotInput
										id={`image-slot-${slot.nodeId}`}
										pinnedProfileId={slot.profileId}
										aspectRatio={nearestImageAspectRatio(
											slot.boxWidth ?? Number.NaN,
											slot.boxHeight ?? Number.NaN,
										)}
										lineColor={
											lineColors[slot.nodeId] ??
											nodeConfigs[slot.nodeId]?.imageColorize?.line ??
											'#000000'
										}
										onLineColorChange={(hex) =>
											setLineColors((current) => ({
												...current,
												[slot.nodeId]: hex,
											}))
										}
										onGenerated={(image) =>
											setImageValues((current) => ({
												...current,
												[slot.nodeId]: image,
											}))
										}
									/>
								</InspectorSection>
								{/* 디자인 SSOT(1:1838): Image Transform은 구분선 없는 별도 섹션이다.
								    생성 전에는 닫힌 채 잠긴다 — compose가 배정된 이미지에만 transform을 적용해서다. */}
								<InspectorSection
									title={`${sectionTitle} Transform`}
									className="border-t-0 pt-0"
									disabled={!imageValues[slot.nodeId]}
								>
									<ImageTransformControl
										value={
											imageTransforms[slot.nodeId] ?? IMAGE_TRANSFORM_DEFAULT
										}
										// compose는 배정된 이미지에만 transform을 적용한다 — 생성 전에는 비활성.
										disabled={!imageValues[slot.nodeId]}
										onChange={(transform) =>
											setImageTransforms((current) => ({
												...current,
												[slot.nodeId]: transform,
											}))
										}
									/>
								</InspectorSection>
							</div>
						)
					})}
					<BackgroundSection />
					{slots.length === 0 && imageSlots.length === 0 && (
						<Typography size="sm" tone="muted">
							이 템플릿에는 편집 가능한 슬롯이 없습니다.
						</Typography>
					)}
				</InspectorPanel>
			}
		>
			<div className="grid h-full min-h-0 min-w-0 overflow-auto">
				<div
					className="m-auto shrink-0 overflow-hidden shadow-lg"
					style={{ width: width * scale, height: height * scale }}
				>
					<div
						ref={previewRef}
						style={{
							width,
							height,
							transform: `scale(${scale})`,
							transformOrigin: 'top left',
						}}
						// biome-ignore lint/security/noDangerouslySetInnerHtml: 서버 컨버터가 만든 inline-style HTML(스크립트 없음) — 어드민 캔버스와 동일 렌더
						dangerouslySetInnerHTML={{ __html: composedHtml }}
					/>
				</div>
			</div>
		</StudioWorkspace>
	)
}
