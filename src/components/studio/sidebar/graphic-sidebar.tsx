'use client'

import { GraphicProfilePicker } from '@/components/studio/graphic/graphic-profile-picker'
import { Controller } from '@/components/studio/shared/controller'
import { ControllerRenderer } from '@/components/studio/shared/controller-renderer'
import {
	ExportAction,
	SizingControls,
	VideoControls,
} from '@/components/studio/shared/output-controls'
import { StudioSidebar } from '@/components/studio/sidebar/studio-sidebar'
import { useGraphicStudio } from '@/features/graphic-generation/hooks/use-graphic-studio'
import { STUDIO_OUTPUT_FORMAT_OPTIONS } from '@/features/studio-export/export-contract'
import type { GraphicExportView } from '@/features/studio-export/hooks/use-graphic-export'

/** Definition을 Controller primitive로 투영한다. 캔버스와 런타임 구현은 모른다. */
export function GraphicSidebar({ output }: { output: GraphicExportView }) {
	const { config, profiles, controls } = useGraphicStudio()
	const format = output.draft?.format
	const video = format === 'mp4' ? config.output.video?.mp4 : undefined
	const formatOptions = STUDIO_OUTPUT_FORMAT_OPTIONS.filter(({ value }) =>
		config.output.formats.includes(value),
	)
	const formatLabel = formatOptions.find(({ value }) => value === format)?.label
	const footer = output.draft ? (
		<>
			<div className="flex flex-col gap-1">
				<div className="flex h-9 items-center pt-1">
					<span className="text-sm font-semibold text-muted-foreground">Setting</span>
				</div>
				<SizingControls
					value={{ width: output.draft.width, height: output.draft.height }}
					maxWidth={video?.maxWidth}
					maxHeight={video?.maxHeight}
					onChange={output.setSize}
				/>
				<Controller.Row label="Format" readonly={config.output.formats.length <= 1}>
					{config.output.formats.length <= 1 ? (
						<span className="text-sm text-muted-foreground">{formatLabel}</span>
					) : (
						<Controller.Select
							options={formatOptions}
							value={format}
							onChange={(next) =>
								output.setFormat(next as (typeof config.output.formats)[number])
							}
						/>
					)}
				</Controller.Row>
				{format === 'mp4' && video && (
					<VideoControls
						fps={output.draft.fps}
						fpsOptions={video.fps}
						durationSeconds={output.draft.durationSeconds}
						maxDurationSeconds={video.maxDurationSeconds}
						onFpsChange={output.setFps}
						onDurationChange={output.setDuration}
					/>
				)}
			</div>
			<ExportAction
				busy={output.busy}
				disabled={!output.canExport}
				error={output.error}
				onExport={output.run}
			/>
		</>
	) : undefined

	return (
		<Controller.Browser.Root>
			<StudioSidebar
				header={
					<Controller.AssetCard
						title={config.name}
						subtitle={`${config.type.toUpperCase()} Graphic`}
						buttonLabel="Change"
						aria-label="그래픽 변경"
						tabs={['Graphic Profiles']}
						empty={
							profiles.options.length <= 1
								? '교체할 다른 그래픽 프로파일이 없습니다.'
								: undefined
						}
						className="min-h-32 items-start"
					>
						<GraphicProfilePicker />
					</Controller.AssetCard>
				}
				footer={footer}
			>
				<ControllerRenderer
					groups={config.controller.groups}
					values={controls.values}
					bindings={controls.bindings}
					onChange={controls.update}
				/>
			</StudioSidebar>
		</Controller.Browser.Root>
	)
}
