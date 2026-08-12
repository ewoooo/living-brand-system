'use client'

import { Typography } from '@/components/ui/typography'
import type { AgentGeneratedImagesAttachment } from '@/features/image-generation/services/generate-image.service'

type AgentChatGeneratedImagesProps = {
	attachment: AgentGeneratedImagesAttachment
}

export function AgentChatGeneratedImages({ attachment }: AgentChatGeneratedImagesProps) {
	return (
		<div data-slot="agent-chat-generated-images" className="flex w-full flex-col gap-2">
			{attachment.profileName ? (
				<Typography size="sm" tone="muted">
					적용된 프로파일: {attachment.profileName}
				</Typography>
			) : null}
			<div className="grid w-full grid-cols-2 gap-2">
				{attachment.images.map((src, index) => (
					<div key={src} className="relative">
						{/* biome-ignore lint/performance/noImgElement: 챗 생성 미리보기, 최적화 불필요 */}
						<img
							src={src}
							alt={`생성 결과 ${index + 1}`}
							className="w-full rounded-md border border-border bg-background"
						/>
						<a
							href={src}
							download={`hd-image-${index + 1}.${imgExt(src)}`}
							className="absolute right-1 bottom-1 rounded bg-background/80 px-1.5 py-0.5 font-body text-sm font-normal underline"
						>
							다운로드
						</a>
					</div>
				))}
			</div>
			{attachment.prompt && (
				<details className="font-body text-xs font-normal text-muted-foreground">
					<summary className="cursor-pointer">생성 프롬프트</summary>
					<Typography size="xs" className="mt-1 whitespace-pre-wrap">
						{attachment.prompt}
					</Typography>
				</details>
			)}
		</div>
	)
}

function imgExt(src: string) {
	return src.startsWith('data:image/')
		? src.slice(11, src.indexOf(';')).replace('jpeg', 'jpg')
		: new URL(src, window.location.href).pathname.split('.').pop() || 'png'
}
