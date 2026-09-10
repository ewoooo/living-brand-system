'use client'

import { Controller } from '@/components/shared/controller'
import { browseEmptyMessage } from '@/components/studio/shared/browse-status'
import { PreviewRefreshSlot } from '@/components/studio/shared/preview-refresh-slot'
import type { useProfilePreview } from '@/components/studio/shared/use-profile-preview'
import { StudioLeftPanel } from '@/components/studio/sidebar/studio-left-panel'
import { TemplateProfilePicker } from '@/components/studio/template/template-profile-picker'
import { useTemplateStudio } from '@/features/template-customization/hooks/use-template-studio'

/**
 * Template 스튜디오의 왼쪽 패널 — **페이지 선택**과 **공통된 것**이 앉는다.
 *
 * 🔑 좌우 기준은 「좌 → 우로 갈수록 구체적이고 자주 만지는 것」이다(사용자 지시, 2026-09-10).
 *    LTR 읽기 방향과 같다.
 * 🔴 **공통 자리는 지금 비어 있다**(사용자 지시). 배경은 레이어 패널의 한 줄이 되어 컨트롤도
 *    우측으로 갔다 — 「판 전체에 걸리니 좌측」이었던 앞 판이 뒤집혔다.
 * 🔴 값은 prop으로 받지 않고 컨텍스트에서 직접 읽는다 — 사이드바가 넘겨 주던 22개 prop이
 *    전부 `useTemplateStudio()`에서 나오던 것이라, 옮기면서 그 경유를 없앤다.
 */
export function TemplateLeftPanel({
	preview,
}: {
	/** 프로파일 미리보기 갱신 — 페이지 선택 카드가 자기 그림을 다시 굽는다. */
	preview: ReturnType<typeof useProfilePreview>
}) {
	const { navigation, config } = useTemplateStudio()

	const templateCount = (navigation.browse.data ?? []).reduce(
		(total, category) => total + category.templates.length,
		0,
	)

	return (
		<StudioLeftPanel
			// 🔑 페이지 선택은 위 상자 맨 위에 고정된다 — 공통된 것이 그 아래에 쌓인다.
			page={
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
				title: '아직 공통 컨트롤이 없습니다',
				description: '판 전체에 걸리는 설정이 이 자리에 옵니다.',
			}}
		/>
	)
}
