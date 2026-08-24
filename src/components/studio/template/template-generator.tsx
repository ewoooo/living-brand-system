'use client'

import { useEffect } from 'react'
import { StudioWorkspace } from '@/components/studio/shared/studio-workspace'
import { TemplateSidebar } from '@/components/studio/sidebar/template-sidebar'
import { useTemplateExport } from '@/features/studio-export/hooks/use-template-export'
import { applyTemplateSessionPatch } from '@/features/template-customization/domain/apply-template-session-patch'
import type {
	PublishedTemplateView,
	TemplateStudioConfig,
} from '@/features/template-customization/domain/template-studio-config'
import { useTemplateStudio } from '@/features/template-customization/hooks/use-template-studio'
import { useTemplateAuthoringHandoff } from '@/features/template-customization/providers/template-authoring-handoff'
import { TemplateStudioProvider } from '@/features/template-customization/providers/template-studio-provider'
import { TemplateCanvas } from './template-canvas'

type TemplateGeneratorProps = {
	config: TemplateStudioConfig
	/** 식별 카드의 부제 — 교체 후보 목록은 자산 브라우저가 열릴 때 따로 가져온다. */
	categoryTitle: string | null
	template: PublishedTemplateView
	/**
	 * 편집 중인 슬롯을 집어 보여 줄 때 쓰는 브랜드 색 — 값의 정본은 `brand-colors` 컬렉션이다.
	 * 🔑 없어도 스튜디오는 열린다(캔버스가 토큰으로 폴백한다) — 그래서 optional이다.
	 */
	highlightColor?: string | null
}

/**
 * Figma에서 가져온 published HTML의 열린 슬롯(input이 달린 텍스트 노드,
 * imageInput이 달린 프레임 이미지 슬롯)을 편집해
 * 미리보기의 Raster Artifact를 공통 Export Layer가 PNG·JPEG·TIFF·PDF·MP4로 변환한다. 서버 상태 변경은 없다 —
 * 입력값은 로컬 state로만 합성한다.
 * 사이드바(컨트롤러)와 캔버스(작업 공간)는 서로를 모른다 — 편집 세션 상태는
 * TemplateStudioProvider(features)가 단일 소유하고 둘 다 컨텍스트로만 소통한다.
 */
export function TemplateGenerator({
	config,
	categoryTitle,
	template,
	highlightColor = null,
}: TemplateGeneratorProps) {
	return (
		<TemplateStudioProvider
			config={config}
			template={template}
			categoryTitle={categoryTitle}
			highlightColor={highlightColor}
		>
			<TemplateWorkspace template={template} />
		</TemplateStudioProvider>
	)
}

function TemplateWorkspace({ template }: { template: PublishedTemplateView }) {
	const session = useTemplateStudio()
	const { canvas, config, execution } = session
	useTemplateAuthoringPatch(template.id, session)
	const exporting = useTemplateExport({
		artifact: canvas.artifact,
		videoArtifact: canvas.videoArtifact,
		capability: config.output,
		metadata: {
			fileName: template.name,
			width: config.template.exportOption.canvas.width,
			height: config.template.exportOption.canvas.height,
			maxScale: config.template.exportOption.maxScale,
			controller: {
				groups: config.controller.groups,
				values: execution.controllerValues,
			},
		},
	})

	return (
		<StudioWorkspace sidebar={<TemplateSidebar exporting={exporting} />}>
			<TemplateCanvas />
		</StudioWorkspace>
	)
}

/**
 * 챗이 만든 편집안을 이 스튜디오에 얹는다.
 *
 * 🔑 소비를 **provider가 아니라 이 조립 지점**에서 한다 — 세션 provider는 챗을 몰라야 한다
 *    (사이드바·캔버스가 서로를 모르는 것과 같은 이유다).
 * 🔴 `templateId`가 다르면 집어 가지 않는다. 챗이 A 템플릿용 편집안을 만들고 사용자가 B 스튜디오를
 *    열어도 B가 그것을 먹으면 안 된다 — 슬롯 id가 우연히 겹치면 조용히 엉뚱한 값이 들어간다.
 */
function useTemplateAuthoringPatch(
	templateId: number,
	session: ReturnType<typeof useTemplateStudio>,
) {
	const { pending, clear } = useTemplateAuthoringHandoff()
	useEffect(() => {
		if (!pending || pending.templateId !== templateId) return
		applyTemplateSessionPatch(session, pending.patch)
		// 🔑 얹은 즉시 비운다 — 남겨 두면 사용자가 손으로 고친 값을 리렌더마다 되돌린다.
		clear(pending.id)
	}, [clear, pending, session, templateId])
}
