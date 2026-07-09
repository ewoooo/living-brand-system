'use client'

import type { AgentGeneratedImagesAttachment } from '../services/get-agent-tools.service'

export function AgentChatGeneratedImages({
	attachment,
}: {
	attachment: AgentGeneratedImagesAttachment
}) {
	return (
		<div className="grid w-full grid-cols-2 gap-2">
			{attachment.images.map((src, index) => (
				// biome-ignore lint/performance/noImgElement: 챗 생성 미리보기, 최적화 불필요
				<img
					key={src}
					src={src}
					alt={`생성 결과 ${index + 1}`}
					className="w-full rounded-md border border-border bg-background"
				/>
			))}
		</div>
	)
}
