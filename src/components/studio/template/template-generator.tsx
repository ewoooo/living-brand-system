'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { StudioWorkspace } from '@/components/studio/studio-workspace'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import type { GetCreateNavigationOutput } from '@/services/get-create-navigation.service'
import type { PublishedHtmlTemplate } from '@/services/get-published-template.service'
import { useTemplateExport } from '@/features/template-export/hooks/use-template-export'
import { pixelsToMillimeters } from '@/features/template-export/print-policy'
import { collectTemplateSlots } from '@/services/collect-template-slots.service'
import { composeTemplateHtml } from '@/services/compose-template-html.client'
import { TextSlotInput } from './text-slot-input'

const PREVIEW_WIDTH = 480

/**
 * Figma에서 가져온 published HTML의 열린 슬롯(input이 달린 텍스트 노드)을 편집해
 * 미리보기 그대로 PNG·운영자 정책의 CMYK TIFF 또는 mm 단위 CMYK PDF로 내보낸다. 서버 상태 변경은 없다 —
 * 입력값은 로컬 state로만 합성한다.
 * 미리보기는 어드민 캔버스와 동일한 동일-문서 렌더 — iframe(opaque origin)은 벡터 mask의
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
	const [values, setValues] = useState<Record<string, string>>({})
	const { html, nodeConfigs, width, height } = template
	const scale = Math.min(1, PREVIEW_WIDTH / width)
	const selectedTemplateHref =
		navigation.categories
			.flatMap((category) => category.templates)
			.find((item) => item.id === template.id)?.href ?? ''

	const slots = useMemo(() => collectTemplateSlots(html, nodeConfigs), [html, nodeConfigs])

	// 사용자가 만진 슬롯만 텍스트 오버라이드로 합성한다(만지지 않은 슬롯은 저작 텍스트 유지).
	const composedHtml = useMemo(
		() =>
			composeTemplateHtml(
				html,
				Object.fromEntries(
					Object.entries(values).map(([nodeId, text]) => [nodeId, { text }]),
				),
			),
		[html, values],
	)
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
							열린 텍스트 슬롯을 편집하세요.
						</Typography>
					</CardHeader>
					<CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="template-select">템플릿</Label>
							<select
								id="template-select"
								value={selectedTemplateHref}
								onChange={(event) => router.push(event.currentTarget.value)}
								className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
							>
								{navigation.categories.map(
									(category) =>
										category.templates.length > 0 && (
											<optgroup key={category.id} label={category.title}>
												{category.templates.map((item) => (
													<option key={item.id} value={item.href}>
														{item.name}
													</option>
												))}
											</optgroup>
										),
								)}
							</select>
						</div>

						{slots.map((slot) => (
							<div key={slot.nodeId} className="flex flex-col gap-1">
								<label
									htmlFor={`slot-${slot.nodeId}`}
									className="font-body text-sm font-normal text-muted-foreground"
								>
									{slot.input.label ?? slot.name}
								</label>
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
							</div>
						))}
						{slots.length === 0 && (
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
