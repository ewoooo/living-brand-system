'use client'

import { Controller } from '@/components/shared/controller'
import { PrintControls, VideoControls } from '@/components/studio/shared/output-controls'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useImageStudio } from '@/features/image-generation/hooks/use-image-studio'
import type { ImageExportView } from '@/features/studio-export/hooks/use-image-export'

/**
 * 내보내기 패널 — 좌측 세 상자 중 맨 아래(사용자 지시, 2026-09-21).
 *
 * 🔴 우측 사이드바의 Setting 블록에서 **내보내기만** 떼어 왔다. 장수·비율·해상도는 지금 캔버스에
 *    무엇을 만들지를 정하는 값이라 우측에 남는다 — 좌우 기준이 「좌: 무엇을 올릴지 / 우: 올라온
 *    것을 만짐」이기 때문이다.
 */
export function ImageExportPanel({ download }: { download: ImageExportView }) {
	const { config } = useImageStudio()
	const video = download.format === 'mp4' ? config.output.video?.mp4 : undefined

	return (
		<div className="flex flex-col gap-2 px-3 py-3">
			<div className="flex h-9 items-center">
				<span className="font-semibold text-muted-foreground text-sm">Export</span>
			</div>
			<Controller.Row label="Format">
				<Controller.Select
					options={download.formats.map((format) => ({
						value: format,
						label: format.toUpperCase(),
					}))}
					value={download.format ?? ''}
					onChange={(value) =>
						download.setFormat(value as (typeof download.formats)[number])
					}
				/>
			</Controller.Row>
			{(download.format === 'tiff' || download.format === 'pdf') &&
				download.ppi &&
				config.output.print && (
					<PrintControls
						ppi={download.ppi}
						options={config.output.print.ppi}
						onChange={download.setPpi}
					/>
				)}
			{video && download.fps && (
				<VideoControls
					fps={download.fps}
					fpsOptions={video.fps}
					durationSeconds={download.durationSeconds}
					maxDurationSeconds={video.maxDurationSeconds}
					onFpsChange={download.setFps}
					onDurationChange={download.setDuration}
				/>
			)}
			<div className="flex gap-2">
				<Button
					className="h-11 flex-1"
					onClick={download.selected.run}
					disabled={download.busy || !download.selected.canExport}
				>
					선택한 이미지 저장
				</Button>
				<Button
					variant="muted"
					className="h-11 flex-1"
					onClick={download.all.run}
					disabled={download.busy || !download.all.canExport}
				>
					전부 저장
				</Button>
			</div>
			{download.error && (
				<Typography role="alert" size="sm" className="text-destructive">
					{download.error}
				</Typography>
			)}
		</div>
	)
}
