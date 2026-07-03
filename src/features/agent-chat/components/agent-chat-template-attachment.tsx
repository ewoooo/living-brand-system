'use client'

import { Download } from '@carbon/icons-react'
import { useEffect, useRef, useState } from 'react'
import { TemplateRenderer } from '@/components/template-renderer'
import {
	Attachment,
	AttachmentAction,
	AttachmentActions,
	AttachmentContent,
	AttachmentDescription,
	AttachmentMedia,
	AttachmentTitle,
} from '@/components/ui/attachment'
import { useTemplatePngExport } from '@/hooks/use-template-png-export'
import type { AgentTemplateImageAttachment } from '../services/get-agent-tools.service'

const PREVIEW_WIDTH = 280

export function AgentChatTemplateAttachment({
	attachment,
}: {
	attachment: AgentTemplateImageAttachment
}) {
	const { exportPng, isExporting, exportError, exportNode } = useTemplatePngExport({
		template: attachment.template,
		values: attachment.values,
		fileName: attachment.name,
	})

	return (
		<Attachment orientation="vertical" className="w-full rounded-lg p-2">
			<AttachmentMedia
				variant="image"
				className="aspect-auto h-auto w-full rounded-md border border-border bg-background p-0"
			>
				<TemplateAttachmentMedia attachment={attachment} />
			</AttachmentMedia>
			<AttachmentContent className="w-full px-1 pt-2">
				<AttachmentTitle>{attachment.name}</AttachmentTitle>
				<AttachmentDescription>템플릿 이미지</AttachmentDescription>
			</AttachmentContent>
			<AttachmentActions>
				<AttachmentAction
					aria-label="템플릿 이미지 다운로드"
					disabled={isExporting}
					onClick={exportPng}
				>
					<Download />
				</AttachmentAction>
			</AttachmentActions>
			{exportError && <p className="px-1 text-destructive text-xs">{exportError}</p>}
			{exportNode}
		</Attachment>
	)
}

function TemplateAttachmentMedia({ attachment }: { attachment: AgentTemplateImageAttachment }) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [containerWidth, setContainerWidth] = useState(PREVIEW_WIDTH)
	const renderWidth = Math.max(
		1,
		Math.min(PREVIEW_WIDTH, containerWidth, attachment.template.width),
	)
	const scale = renderWidth / attachment.template.width

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
		<div ref={containerRef} className="flex w-full justify-center overflow-hidden">
			<TemplateRenderer
				template={attachment.template}
				values={attachment.values}
				scale={scale}
			/>
		</div>
	)
}
