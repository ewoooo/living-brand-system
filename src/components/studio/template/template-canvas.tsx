'use client'

import { useEffect, useRef, useState } from 'react'
import { fitPreviewSize } from '@/components/studio/shared/fit-preview-size'
import { useTemplateStudio } from '@/features/template-customization/hooks/use-template-studio'

/**
 * 템플릿 스튜디오의 작업 공간(미리보기 캔버스) — 사이드바를 모른다.
 * 합성 결과와 미리보기 ref는 TemplateStudioProvider 컨텍스트로만 주고받는다.
 * 미리보기는 동일-문서 렌더(어드민 캔버스는 same-origin iframe) — opaque origin iframe은 벡터 mask의
 * CORS 로드를 깨뜨린다. 임포트 HTML은 스크립트 없는 inline-style이다.
 */
export function TemplateCanvas() {
	const { config, canvas } = useTemplateStudio()
	const { width, height } = config.template.exportOption.canvas
	const stageRef = useRef<HTMLDivElement>(null)
	const [preview, setPreview] = useState({ width, height })
	const scale = preview.width / width

	useEffect(() => {
		const stage = stageRef.current
		if (!stage) return
		const resize = (bounds: { width: number; height: number }) => {
			if (bounds.width > 0 && bounds.height > 0) {
				setPreview(fitPreviewSize(bounds, { width, height }))
			}
		}
		const observer = new ResizeObserver(([entry]) => {
			if (entry) resize(entry.contentRect)
		})
		resize({ width: stage.clientWidth, height: stage.clientHeight })
		observer.observe(stage)
		return () => observer.disconnect()
	}, [height, width])

	return (
		<div ref={stageRef} className="grid h-full min-h-0 min-w-0 overflow-hidden">
			<div
				data-slot="template-preview"
				className="m-auto shrink-0 overflow-hidden shadow-lg"
				style={preview}
			>
				<div
					ref={canvas.previewRef}
					style={{
						width,
						height,
						transform: `scale(${scale})`,
						transformOrigin: 'top left',
					}}
					// biome-ignore lint/security/noDangerouslySetInnerHtml: 서버 컨버터가 만든 inline-style HTML(스크립트 없음) — 어드민 캔버스와 동일 렌더
					dangerouslySetInnerHTML={{ __html: canvas.html }}
				/>
			</div>
		</div>
	)
}
