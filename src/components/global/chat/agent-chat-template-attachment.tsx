'use client'

import { DocumentDownload, DocumentPdf, Download } from '@carbon/icons-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
	Attachment,
	AttachmentAction,
	AttachmentActions,
	AttachmentContent,
	AttachmentDescription,
	AttachmentMedia,
	AttachmentTitle,
} from '@/components/ui/attachment'
import { Typography } from '@/components/ui/typography'
import type { AgentTemplateImageAttachment } from '@/features/agent-chat/services/agent-template-request.service'
import type { StudioOutputFormat } from '@/features/studio-export/export-contract'
import { useExport } from '@/features/studio-export/hooks/use-export'
import {
	canExportTemplate,
	createTemplateExportRequest,
	type TemplateExportContext,
	type TemplateExportRequest,
} from '@/features/studio-export/services/export-template'
import { exportTemplate } from '@/features/studio-export/services/export-template.client'
import { composeTemplateHtml } from '@/features/template-core/runtime/compose-template-html.client'
import { createControllerValues } from '@/modules/studio-controller/controller-definition'

const PREVIEW_WIDTH = 280

type AgentChatTemplateAttachmentProps = {
	attachment: AgentTemplateImageAttachment
}

/** html 첨부: 슬롯 값을 base html에 합성해 미리보기·다운로드한다 (Create 화면과 동일 렌더). */
export function AgentChatTemplateAttachment({ attachment }: AgentChatTemplateAttachmentProps) {
	const composedHtml = useMemo(
		() =>
			composeTemplateHtml(
				attachment.html,
				Object.fromEntries(
					Object.entries(attachment.values).flatMap(([nodeId, value]) =>
						typeof value.text === 'string' ? [[nodeId, { text: value.text }]] : [],
					),
				),
			),
		[attachment.html, attachment.values],
	)
	const exportContext: TemplateExportContext = {
		fileName: attachment.name,
		height: attachment.height,
		html: composedHtml,
		printPpi: attachment.printPpi,
		templateId: attachment.templateId,
		templateVersion: attachment.templateVersion,
		width: attachment.width,
		output: attachment.output,
		controller: {
			groups: attachment.controller.groups,
			values: {
				...createControllerValues(attachment.controller.groups),
				...Object.fromEntries(
					Object.entries(attachment.values).flatMap(([nodeId, value]) =>
						typeof value.text === 'string'
							? [[`text:${nodeId}`, value.text] as const]
							: [],
					),
				),
			},
		},
	}
	const output = useExport<TemplateExportRequest>({
		capability: attachment.output,
		canExport: (request) => canExportTemplate(request, exportContext),
		execute: (request) => exportTemplate(request, exportContext),
	})
	const request = (format: StudioOutputFormat) =>
		createTemplateExportRequest(format, attachment.printPpi)
	const canExport = (format: StudioOutputFormat) => {
		const candidate = request(format)
		return Boolean(candidate && output.canExport(candidate))
	}
	const run = (format: StudioOutputFormat) => {
		const candidate = request(format)
		if (candidate) void output.run(candidate)
	}

	return (
		<TemplateAttachmentFrame
			name={attachment.name}
			description={`${attachment.output.formats.map((format) => format.toUpperCase()).join(' · ')} 출력`}
			isExporting={output.exporting !== null}
			exportError={output.error}
			onExport={canExport('png') ? () => run('png') : undefined}
			onExportTiff={canExport('tiff') ? () => run('tiff') : undefined}
			onExportPdf={canExport('pdf') ? () => run('pdf') : undefined}
		>
			<ScaledMedia contentWidth={attachment.width}>
				{(scale) => (
					<div
						style={{
							width: attachment.width * scale,
							height: attachment.height * scale,
						}}
					>
						<div
							style={{
								width: attachment.width,
								height: attachment.height,
								transform: `scale(${scale})`,
								transformOrigin: 'top left',
							}}
							// biome-ignore lint/security/noDangerouslySetInnerHtml: 서버 컨버터가 만든 inline-style HTML(스크립트 없음) — Create 화면과 동일 렌더
							dangerouslySetInnerHTML={{ __html: composedHtml }}
						/>
					</div>
				)}
			</ScaledMedia>
		</TemplateAttachmentFrame>
	)
}

function TemplateAttachmentFrame({
	name,
	description = '템플릿 이미지',
	isExporting,
	exportError,
	onExport,
	onExportPdf,
	onExportTiff,
	children,
}: {
	name: string
	description?: string
	isExporting: boolean
	exportError: string | null
	onExport?: () => void
	onExportPdf?: () => void
	onExportTiff?: () => void
	children: React.ReactNode
}) {
	return (
		<Attachment orientation="vertical" className="w-full rounded-lg p-2">
			<AttachmentMedia
				variant="image"
				className="aspect-auto h-auto w-full rounded-md border border-border bg-background p-0"
			>
				{children}
			</AttachmentMedia>
			<AttachmentContent className="w-full px-1 pt-2">
				<AttachmentTitle>{name}</AttachmentTitle>
				<AttachmentDescription>{description}</AttachmentDescription>
			</AttachmentContent>
			<AttachmentActions>
				{onExport && (
					<AttachmentAction
						aria-label="PNG로 다운로드"
						disabled={isExporting}
						onClick={onExport}
						title="PNG로 다운로드"
					>
						<Download />
					</AttachmentAction>
				)}
				{onExportTiff && (
					<AttachmentAction
						aria-label="CMYK TIFF로 다운로드"
						disabled={isExporting}
						onClick={onExportTiff}
						title="CMYK TIFF로 다운로드"
					>
						<DocumentDownload />
					</AttachmentAction>
				)}
				{onExportPdf && (
					<AttachmentAction
						aria-label="CMYK PDF로 내보내기"
						disabled={isExporting}
						onClick={onExportPdf}
						title="CMYK PDF로 내보내기"
					>
						<DocumentPdf />
					</AttachmentAction>
				)}
			</AttachmentActions>
			{exportError && (
				<Typography size="sm" tone="destructive" className="px-1">
					{exportError}
				</Typography>
			)}
		</Attachment>
	)
}

/** 첨부 폭에 맞춰 콘텐츠를 contain 축소한다. children은 scale을 받아 원본 크기로 그린다. */
function ScaledMedia({
	contentWidth,
	children,
}: {
	contentWidth: number
	children: (scale: number) => React.ReactNode
}) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [containerWidth, setContainerWidth] = useState(PREVIEW_WIDTH)
	const renderWidth = Math.max(1, Math.min(PREVIEW_WIDTH, containerWidth, contentWidth))
	const scale = renderWidth / contentWidth

	useEffect(() => {
		const element = containerRef.current
		if (!element) {
			return
		}

		const updateWidth = (width: number) => {
			setContainerWidth(Math.max(1, Math.floor(width)))
		}
		updateWidth(element.clientWidth)

		const observer = new ResizeObserver(([entry]) => {
			if (entry) {
				updateWidth(entry.contentRect.width)
			}
		})
		observer.observe(element)

		return () => observer.disconnect()
	}, [])

	return (
		<div
			ref={containerRef}
			data-slot="scaled-media"
			className="flex w-full justify-center overflow-hidden"
		>
			{children(scale)}
		</div>
	)
}
