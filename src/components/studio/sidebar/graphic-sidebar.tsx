'use client'

import { Controller } from '@/components/shared/controller'
import { ControllerRenderer } from '@/components/shared/controller-renderer'
import { GraphicProfilePicker } from '@/components/studio/graphic/graphic-profile-picker'
import { browseEmptyMessage } from '@/components/studio/shared/browse-status'
import {
	ExportAction,
	SizingControls,
	VideoControls,
} from '@/components/studio/shared/output-controls'
import { PreviewRefreshSlot } from '@/components/studio/shared/preview-refresh-slot'
import type { useProfilePreview } from '@/components/studio/shared/use-profile-preview'
import { StudioSidebar } from '@/components/studio/sidebar/studio-sidebar'
import { useGraphicStudio } from '@/features/graphic-generation/hooks/use-graphic-studio'
import { STUDIO_OUTPUT_FORMAT_OPTIONS } from '@/features/studio-export/export-contract'
import type { GraphicExportView } from '@/features/studio-export/hooks/use-graphic-export'
import { splitControllerGroups } from '@/modules/studio-controller/controller-definition'

/** Definition을 Controller primitive로 투영한다. 캔버스와 런타임 구현은 모른다. */
export function GraphicSidebar({
	output,
	preview,
}: {
	output: GraphicExportView
	preview: ReturnType<typeof useProfilePreview>
}) {
	const { config, profiles, controls } = useGraphicStudio()
	/**
	 * 🔑 창작자에게는 런타임이 선언한 축만 보인다. 나머지는 「고급」으로 접는 것이 아니라
	 *    **화면에 아예 없다** — 창작자에게는 고급 옵션조차 필요하지 않고, 그 값은 manager가
	 *    Payload에서 조정한다. 선언이 없으면 전부 보인다.
	 */
	const { basic: basicGroups } = splitControllerGroups(
		config.controller.groups,
		config.controller.basic,
	)
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
					ppi={output.ppi}
					ppiOptions={output.ppiOptions}
					onChange={output.setSize}
					onPpiChange={output.setPpi}
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
					<PreviewRefreshSlot error={preview.error}>
						<Controller.AssetCard
							title={config.name}
							subtitle={`${config.type.toUpperCase()} Graphic`}
							buttonLabel="Change"
							aria-label="그래픽 변경"
							tabs={['Graphic Profiles']}
							previewImage={preview.image ?? config.previewImage}
							onRefreshPreview={preview.canRefresh ? preview.refresh : undefined}
							refreshingPreview={preview.refreshing}
							empty={browseEmptyMessage(
								profiles.browse.status,
								(profiles.browse.data?.length ?? 0) > 1,
								'교체할 다른 그래픽 프로파일이 없습니다.',
							)}
							className="min-h-32 items-start"
						>
							<GraphicProfilePicker />
						</Controller.AssetCard>
					</PreviewRefreshSlot>
				}
				footer={footer}
			>
				<ControllerRenderer
					groups={basicGroups}
					presentation={config.controllerPresentation}
					values={controls.values}
					bindings={controls.bindings}
					onChange={controls.update}
				/>
			</StudioSidebar>
		</Controller.Browser.Root>
	)
}
