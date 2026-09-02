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
	// 🔑 기본에는 판에 앉히는 축(위치·맞춤)만 남기고 나머지는 「고급 설정」 뒤로 접는다.
	//    무엇이 기본인지는 런타임이 선언하고, 선언이 없으면 전부 기본이다.
	const { basic: basicGroups, advanced: advancedGroups } = splitControllerGroups(
		config.controller.groups,
		config.controller.basic,
	)
	/**
	 * 「고급 설정」을 열면 안쪽 그룹은 전부 닫혀 있다.
	 *
	 * 🔴 Admin이 정한 `defaultOpen`을 그대로 쓰면 열자마자 40여 개가 쏟아진다 — 접은 이유가 사라진다.
	 *    Admin의 표현 정책은 기본 화면에만 적용된다.
	 */
	const advancedPresentation = {
		groups: advancedGroups.map((group) => ({
			groupId: group.id,
			collapsible: true,
			defaultOpen: false,
		})),
	}
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
				{advancedGroups.length > 0 && (
					<Controller.Group defaultOpen={false} title="고급 설정">
						{/* 안쪽 목록은 이 그룹이 이미 구분선을 그었으므로 자기 위 선을 걷는다. */}
						<ControllerRenderer
							first={false}
							groups={advancedGroups}
							presentation={advancedPresentation}
							values={controls.values}
							bindings={controls.bindings}
							onChange={controls.update}
						/>
					</Controller.Group>
				)}
			</StudioSidebar>
		</Controller.Browser.Root>
	)
}
