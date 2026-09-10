'use client'

import { Controller } from '@/components/shared/controller'
import { browseEmptyMessage } from '@/components/studio/shared/browse-status'
import { PreviewRefreshSlot } from '@/components/studio/shared/preview-refresh-slot'
import type { useProfilePreview } from '@/components/studio/shared/use-profile-preview'
import { StudioLeftPanel } from '@/components/studio/sidebar/studio-left-panel'
import { BackgroundSection } from '@/components/studio/template/background-section'
import { TemplateProfilePicker } from '@/components/studio/template/template-profile-picker'
import {
	findTemplateControl,
	findTemplateControlGroup,
	partitionTemplateSlots,
} from '@/features/template-customization/domain/template-studio-config'
import { useTemplateStudio } from '@/features/template-customization/hooks/use-template-studio'

/**
 * Template 스튜디오의 왼쪽 패널 — **판 전체에 걸리는 것**이 앉는다.
 *
 * 🔑 좌우 기준은 「좌 → 우로 갈수록 구체적이고 자주 만지는 것」이다(사용자 지시, 2026-09-10).
 *    LTR 읽기 방향과 같다. fluted-glass가 같은 기준으로 갈라 놨고 그 정의 주석이 근거다 —
 *    「영향이 크다는 것과 창작자가 그것을 만지리라는 것은 다른 얘기다」.
 * 🔴 그래서 배경이 여기다. 스코프가 `kind: 'canvas'`(판 전체)이고 한 번 정하면 덜 만진다.
 *    슬롯별(Text·Vector)은 고른 레이어에 딸린 것이라 오른쪽이 소유한다.
 * 🔴 값은 prop으로 받지 않고 컨텍스트에서 직접 읽는다 — 사이드바가 넘겨 주던 22개 prop이
 *    전부 `useTemplateStudio()`에서 나오던 것이라, 옮기면서 그 경유를 없앤다.
 */
export function TemplateLeftPanel({
	preview,
}: {
	/** 프로파일 미리보기 갱신 — 페이지 선택 카드가 자기 그림을 다시 굽는다. */
	preview: ReturnType<typeof useProfilePreview>
}) {
	const { navigation, config, background, focus } = useTemplateStudio()
	const { background: backgroundSlot } = partitionTemplateSlots(config.template.slots)
	const { canvas } = config.template.exportOption

	const typeControl = backgroundSlot
		? findTemplateControl(config, backgroundSlot.typeControlId)
		: undefined
	const colorControl = backgroundSlot
		? findTemplateControl(config, backgroundSlot.colorControlId)
		: undefined
	const dimmerControl = backgroundSlot
		? findTemplateControl(config, backgroundSlot.dimmerControlId)
		: undefined
	const dimmerOpacityControl = backgroundSlot
		? findTemplateControl(config, backgroundSlot.dimmerOpacityControlId)
		: undefined
	const group = backgroundSlot
		? findTemplateControlGroup(config, backgroundSlot.typeControlId)
		: undefined

	const ready =
		backgroundSlot && group && typeControl?.kind === 'select' && colorControl?.kind === 'color'

	const templateCount = (navigation.browse.data ?? []).reduce(
		(total, category) => total + category.templates.length,
		0,
	)

	return (
		<StudioLeftPanel
			// 🔑 페이지 선택은 **좌측 헤더**다(사용자 지시, 2026-09-10) — 우측 footer의 내보내기와
			//    대칭이다. 양쪽 다 패널을 여닫는 자리이고 본문은 그 사이에 놓인다.
			header={
				<PreviewRefreshSlot error={preview.error}>
					<Controller.AssetCard
						title={config.name}
						subtitle={navigation.categoryTitle ?? undefined}
						buttonLabel="Change"
						aria-label="템플릿 변경"
						tabs={['Templates']}
						previewImage={preview.image ?? config.previewImage}
						onRefreshPreview={preview.canRefresh ? preview.refresh : undefined}
						refreshingPreview={preview.refreshing}
						empty={browseEmptyMessage(
							navigation.browse.status,
							templateCount > 1,
							'교체할 다른 템플릿이 없습니다.',
						)}
						className="min-h-32 items-start"
					>
						<TemplateProfilePicker />
					</Controller.AssetCard>
				</PreviewRefreshSlot>
			}
			empty={{
				title: '이 템플릿에는 배경 컨트롤이 없습니다',
				description: '판 전체에 걸리는 설정이 이 자리에 옵니다.',
			}}
		>
			{ready ? (
				<BackgroundSection
					section={sectionFocus(focus)}
					groupDefinition={group}
					groupPresentation={config.controllerPresentation?.groups.find(
						({ groupId }) => groupId === group.id,
					)}
					typeDefinition={typeControl}
					colorDefinition={colorControl}
					dimmerDefinition={dimmerControl?.kind === 'toggle' ? dimmerControl : undefined}
					dimmerOpacityDefinition={
						dimmerOpacityControl?.kind === 'range' ? dimmerOpacityControl : undefined
					}
					canvasAspectRatio={
						canvas.width && canvas.height ? canvas.width / canvas.height : undefined
					}
					imageContracts={background.contracts}
					featureBindings={background.featureBindings}
					graphicConfigs={background.graphicConfigs}
					graphicBindings={background.graphicBindings}
					value={background.state}
					onChange={background.update}
					onColorChange={(next) => {
						if (typeof next === 'string' || next === null) background.setColor(next)
					}}
					onTypeChange={background.selectType}
					onFeatureChange={background.updateFeature}
					onImageProfileChange={background.selectImageProfile}
					onSelectSampleImage={background.selectSampleImage}
					onGraphicConfigChange={background.selectGraphicConfig}
					onGraphicChange={background.updateGraphic}
					onGenerate={background.generate}
				/>
			) : undefined}
		</StudioLeftPanel>
	)
}

/**
 * 배경 섹션의 강조·포커스 배선 — 사이드바의 `sectionProps`와 **같은 형태여야 한다.**
 * 🔴 `onDeactivate` 같은 이름을 새로 만들면 킷이 안 읽고 조용히 아무 일도 안 한다.
 *    행 포커스는 `onFocusCapture`/`onBlurCapture`다(맨 `div`에 `active`를 주면 React가 경고한다).
 */
function sectionFocus(focus: ReturnType<typeof useTemplateStudio>['focus']) {
	const target = { sectionId: 'section:background', kind: 'canvas' } as const
	return {
		active: focus.target?.sectionId === target.sectionId,
		onActivate: () => focus.set(target),
		onFocusCapture: () => focus.set(target),
		onBlurCapture: () => {
			if (focus.target?.sectionId === target.sectionId) focus.set(null)
		},
	}
}
