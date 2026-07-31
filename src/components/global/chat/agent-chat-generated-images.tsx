'use client'

import type { AgentGeneratedImagesAttachment } from '@/features/generate-image/services/generate-image.service'

export function AgentChatGeneratedImages({
	attachment,
}: {
	attachment: AgentGeneratedImagesAttachment
}) {
	return (
		<div className="flex w-full flex-col gap-2">
			{attachment.profileName ? (
				<p className="font-body text-sm font-normal text-muted-foreground">
					적용된 프로파일: {attachment.profileName}
				</p>
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
							download={`essenherb-image-${index + 1}.${imgExt(src)}`}
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
					<p className="mt-1 whitespace-pre-wrap">{attachment.prompt}</p>
				</details>
			)}
		</div>
	)
}

function imgExt(src: string) {
	return src.slice(5, src.indexOf(';')).split('/')[1] || 'png'
}
