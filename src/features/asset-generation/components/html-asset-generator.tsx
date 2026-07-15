'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { exportHtmlToPng } from '@/hooks/use-template-png-export'
import type { PublishedHtmlTemplate } from '../services/get-published-template.service'

const PREVIEW_WIDTH = 480

/** Figma에서 가져온 published HTML을 격리해 미리보고 원본 크기 PNG로 내보낸다. */
export function HtmlAssetGenerator({ template }: { template: PublishedHtmlTemplate }) {
	const [isExporting, setIsExporting] = useState(false)
	const [exportError, setExportError] = useState<string | null>(null)
	const { html, width, height } = template
	const scale = Math.min(1, PREVIEW_WIDTH / width)
	const srcDoc = useMemo(
		() =>
			`<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0}</style></head><body>${html}</body></html>`,
		[html],
	)

	async function exportPng() {
		setExportError(null)
		setIsExporting(true)

		try {
			await exportHtmlToPng(html, '', template.name)
		} catch {
			setExportError(
				'PNG 내보내기에 실패했습니다. 이미지 원본 접근(CORS)이 막혀 있을 수 있습니다.',
			)
		} finally {
			setIsExporting(false)
		}
	}

	return (
		<section className="flex w-full flex-col gap-6 md:flex-row">
			<div className="flex w-full flex-col gap-3 md:w-72">
				<p className="type-caption-1 text-foreground-muted">
					이 템플릿에는 편집 가능한 슬롯이 없습니다.
				</p>
				<Button onClick={exportPng} disabled={isExporting}>
					{isExporting ? '내보내는 중...' : 'PNG로 내보내기'}
				</Button>
				{exportError && <p className="type-caption-1 text-destructive">{exportError}</p>}
			</div>

			<div className="min-w-0">
				<div
					className="overflow-hidden rounded-md border border-border"
					style={{ width: width * scale, height: height * scale }}
				>
					<iframe
						title={`${template.name} 미리보기`}
						sandbox=""
						referrerPolicy="no-referrer"
						srcDoc={srcDoc}
						style={{
							width,
							height,
							border: 0,
							transform: `scale(${scale})`,
							transformOrigin: 'top left',
						}}
					/>
				</div>
			</div>
		</section>
	)
}
