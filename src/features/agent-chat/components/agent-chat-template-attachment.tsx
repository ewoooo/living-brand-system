'use client'

import { Download } from '@carbon/icons-react'
import { toPng } from 'html-to-image'
import { useRef, useState } from 'react'
import { TemplateRenderer, type TemplateSlotValue } from '@/components/template-renderer'
import {
	Attachment,
	AttachmentAction,
	AttachmentActions,
	AttachmentContent,
	AttachmentDescription,
	AttachmentTitle,
} from '@/components/ui/attachment'
import type { JsonTemplate } from '@/types/json-template'

const PREVIEW_WIDTH = 280

export interface AgentTemplateAttachment {
	name: string
	template: JsonTemplate
	templateId: number
	type: 'template-image'
	values: Record<string, TemplateSlotValue>
}

export function AgentChatTemplateAttachment({
	attachment,
}: {
	attachment: AgentTemplateAttachment
}) {
	const [isExporting, setIsExporting] = useState(false)
	const exportRef = useRef<HTMLDivElement>(null)
	const scale = Math.min(1, PREVIEW_WIDTH / attachment.template.width)

	async function handleDownload() {
		if (!exportRef.current) {
			return
		}

		setIsExporting(true)

		try {
			const dataUrl = await toPng(exportRef.current, { cacheBust: true })
			const link = document.createElement('a')
			link.href = dataUrl
			link.download = `${attachment.name}.png`
			link.click()
		} finally {
			setIsExporting(false)
		}
	}

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
				<AttachmentDescription>Template image</AttachmentDescription>
			</AttachmentContent>
			<AttachmentActions>
				<AttachmentAction
					aria-label="Download template image"
					disabled={isExporting}
					onClick={handleDownload}
				>
					<Download />
				</AttachmentAction>
			</AttachmentActions>
			<div style={{ position: 'fixed', left: -99999, top: 0 }} aria-hidden>
				<div ref={exportRef}>
					<TemplateRenderer template={attachment.template} values={attachment.values} />
				</div>
			</div>
		</Attachment>
	)
}
