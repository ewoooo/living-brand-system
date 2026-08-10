'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { StudioWorkspace } from '@/components/studio/studio-workspace'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
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
import {
	collectTemplateImageSlots,
	collectTemplateSlots,
} from '@/services/collect-template-slots.service'
import { composeTemplateHtml } from '@/services/compose-template-html.client'
import type { GetCreateNavigationOutput } from '@/services/get-create-navigation.service'
import type { PublishedHtmlTemplate } from '@/services/get-published-template.service'
import { ImageSlotInput } from './image-slot-input'
import { TextSlotInput } from './text-slot-input'

const PREVIEW_WIDTH = 480

/**
 * Figma에서 가져온 published HTML의 열린 슬롯(input이 달린 텍스트 노드,
 * imageInput이 달린 프레임 이미지 슬롯)을 편집해
 * 미리보기 그대로 PNG·운영자 정책의 CMYK TIFF 또는 mm 단위 CMYK PDF로 내보낸다. 서버 상태 변경은 없다 —
 * 입력값은 로컬 state로만 합성한다.
 * 미리보기는 동일-문서 렌더(어드민 캔버스는 same-origin iframe) — opaque origin iframe은 벡터 mask의
 * CORS 로드를 깨뜨린다. 임포트 HTML은 스크립트 없는 inline-style이다.
 */
export function TemplateGenerator({
	navigation,
	template,
}: {
	navigation: GetCreateNavigationOutput
	template: PublishedHtmlTemplate
}) {
	const router = useRouter()
	const previewRef = useRef<HTMLDivElement>(null)
	const [values, setValues] = useState<Record<string, string>>({})
	const [clippedSlotIds, setClippedSlotIds] = useState<ReadonlySet<string>>(new Set())
	const [imageValues, setImageValues] = useState<
		Record<string, { backgroundImage: string; generatedImageId: number }>
	>({})
	const { html, nodeConfigs, width, height } = template
	const scale = Math.min(1, PREVIEW_WIDTH / width)
	const selectedTemplateHref =
		navigation.categories
			.flatMap((category) => category.templates)
			.find((item) => item.id === template.id)?.href ?? ''

	const slots = useMemo(() => collectTemplateSlots(html, nodeConfigs), [html, nodeConfigs])
	const imageSlots = useMemo(
		() => collectTemplateImageSlots(html, nodeConfigs),
		[html, nodeConfigs],
	)

	// 사용자가 만진 슬롯만 오버라이드로 합성한다(만지지 않은 슬롯은 저작 값 유지).
	// 텍스트 슬롯(<p>)과 이미지 슬롯(프레임)은 노드가 겹치지 않아 그대로 합친다.
	// 이미지 교체에는 저작 config의 imageColorize만 깔아 재적용한다 — published html의 옛
	// colorize 오버레이는 compose가 멱등 제거하므로, 안 깔면 컬러 치환이 사라진다.
	// imageTransform은 published html에 이미 구워져 있어 절대 다시 넘기지 말 것(prepend 누적).
	const composedHtml = useMemo(
		() =>
			composeTemplateHtml(html, {
				...Object.fromEntries(
					Object.entries(values).map(([nodeId, text]) => [nodeId, { text }]),
				),
				...Object.fromEntries(
					Object.entries(imageValues).map(([nodeId, imageValue]) => [
						nodeId,
						{
							...(nodeConfigs[nodeId]?.imageColorize
								? { imageColorize: nodeConfigs[nodeId].imageColorize }
								: {}),
							...imageValue,
						},
					]),
				),
			}),
		[html, values, imageValues, nodeConfigs],
	)
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

	return (
		<StudioWorkspace
			controller={
				<Card className="min-h-0 gap-0 py-0 lg:h-full">
					<CardHeader className="border-b border-border py-4">
						<CardTitle>템플릿 컨트롤러</CardTitle>
						<Typography size="xs" tone="muted">
							열린 슬롯을 편집하세요.
						</Typography>
					</CardHeader>
					<CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-4">
						<Field>
							<FieldLabel htmlFor="template-select">템플릿</FieldLabel>
							<Select
								value={selectedTemplateHref}
								onValueChange={(value) => router.push(value)}
							>
								<SelectTrigger id="template-select" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
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
						</Field>

						{slots.map((slot) => (
							<Field key={slot.nodeId} className="gap-1">
								<FieldLabel
									htmlFor={`slot-${slot.nodeId}`}
									className="font-normal text-muted-foreground"
								>
									{slot.input.label ?? slot.name}
								</FieldLabel>
								<TextSlotInput
									id={`slot-${slot.nodeId}`}
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
							</Field>
						))}
						{imageSlots.map((slot) => (
							<Field key={slot.nodeId} className="gap-1">
								<FieldLabel
									htmlFor={`image-slot-${slot.nodeId}`}
									className="font-normal text-muted-foreground"
								>
									{slot.name}
								</FieldLabel>
								<ImageSlotInput
									id={`image-slot-${slot.nodeId}`}
									pinnedProfileId={slot.profileId}
									aspectRatio={nearestImageAspectRatio(
										slot.boxWidth ?? Number.NaN,
										slot.boxHeight ?? Number.NaN,
									)}
									onGenerated={(image) =>
										setImageValues((current) => ({
											...current,
											[slot.nodeId]: image,
										}))
									}
								/>
							</Field>
						))}
						{slots.length === 0 && imageSlots.length === 0 && (
							<Typography size="sm" tone="muted">
								이 템플릿에는 편집 가능한 슬롯이 없습니다.
							</Typography>
						)}
					</CardContent>
					<CardFooter className="flex-col items-stretch gap-2 border-t border-border py-4">
						{template.printPpi && (
							<Typography size="xs" tone="muted" className="text-right">
								{template.printPpi}ppi ·{' '}
								{pixelsToMillimeters(width, template.printPpi).toFixed(1)} ×{' '}
								{pixelsToMillimeters(height, template.printPpi).toFixed(1)}mm · CMYK
							</Typography>
						)}
						<Button onClick={() => exportTemplate('png')} disabled={exporting !== null}>
							{exporting === 'png' ? '내보내는 중...' : 'PNG로 내보내기'}
						</Button>
						{canExport('tiff') && (
							<Button
								onClick={() => exportTemplate('tiff')}
								disabled={exporting !== null}
								variant="outline"
							>
								{exporting === 'tiff' ? '내보내는 중...' : 'CMYK TIFF로 내보내기'}
							</Button>
						)}
						{canExport('pdf') && (
							<Button
								onClick={() => exportTemplate('pdf')}
								disabled={exporting !== null}
								variant="outline"
							>
								{exporting === 'pdf' ? '내보내는 중...' : 'CMYK PDF로 내보내기'}
							</Button>
						)}
						{exportError && (
							<Typography role="alert" size="sm" className="text-destructive">
								{exportError}
							</Typography>
						)}
					</CardFooter>
				</Card>
			}
		>
			<div className="grid h-full min-h-0 min-w-0 overflow-auto">
				<div
					className="m-auto shrink-0 overflow-hidden rounded-md border border-border"
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
