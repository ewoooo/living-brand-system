'use client'

import { Download } from '@carbon/icons-react'
import { TemplateRenderer } from '@/components/template-renderer'
import {
	Attachment,
	AttachmentAction,
	AttachmentActions,
	AttachmentContent,
	AttachmentDescription,
	AttachmentTitle,
} from '@/components/ui/attachment'
import { useTemplatePngExport } from '@/components/use-template-png-export'
import type { AgentTemplateImageAttachment } from '../services/get-agent-tools.service'

const PREVIEW_WIDTH = 280

export function AgentChatTemplateAttachment({
	attachment,
}: {
	attachment: AgentTemplateImageAttachment
}) {
	const scale = Math.min(1, PREVIEW_WIDTH / attachment.template.width)
	const { exportPng, isExporting, exportError, exportNode } = useTemplatePngExport({
		template: attachment.template,
		values: attachment.values,
		fileName: attachment.name,
	})

	return (
		<Attachment orientation="vertical" className="w-fit max-w-full rounded-lg p-2">
			<div className="overflow-hidden rounded-md border border-border bg-background">
				<TemplateRenderer
					template={attachment.template}
					values={attachment.values}
					scale={scale}
				/>
			</div>
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
