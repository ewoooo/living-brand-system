import { ContentFrame } from '@/components/shared/content-frame'
import type { GetGuidelineTopicOutput } from '../../services/get-guideline-topic.service'
import { GuidelineHeader, GuidelineHeaderImage } from '../globals/guideline-header'
import { GuidelineHelperProvider, GuidelineHelperSlot } from '../globals/guideline-helper'
import type { GuidelineVariant } from '../globals/guideline-variant'
import { GuidelineBlocks } from '../guideline-blocks'
import { RefreshRouteOnSave } from '../refresh-route-on-save'

/**
 * 토픽 한 화면 — 머리(이미지 + 제목)와 본문 블록. 디자인 정본은 Figma HD_LBS_UI 61:3376.
 *
 * 🔑 **섹션는 블록이다**(2026-08-26). 그전에는 하위 문서(3단계 '페이지')였고 이 컴포넌트가
 *    그 목록을 따로 그렸다. 지금은 토픽 문서의 `blocks` 하나에 섹션(section)과 그 밖의
 *    블록이 순서대로 들어가고, 간격은 `GuidelineBlocks`가 종류를 보고 정한다.
 * 🔴 **빈 배열이면 아무 계층도 만들지 않는다.** 옛 구현은 제목과 묶으려고 래핑을 두 겹 더 세웠고,
 *    값이 없는 토픽에서 그것이 그대로 빈 상자로 남았다(2026-08-18).
 *
 * 🔴 토픽 **설명**은 그리지 않는다. 전 토픽 전수 조사에서 값이 하나도 없었고, 2열 hgroup의
 *    오른쪽 칸이 항상 빈 채로 폭만 차지했다. Figma의 Section Heading도 제목 하나뿐이다.
 */
export function GuidelineTopic({
	topic,
	previewDocumentId,
}: {
	topic: GetGuidelineTopicOutput
	previewDocumentId?: number
}) {
	const variant = 'topic' satisfies GuidelineVariant
	const isPreview = previewDocumentId !== undefined

	return (
		// Helper(하단 Floating Controller)의 provider와 자리는 이 <article> 하나가 감싼다 —
		// 컨트롤을 가진 블록이 전부 이 안에 있고, 알약이 본문 폭 기준으로 가운데에 서야 하기 때문이다.
		<GuidelineHelperProvider>
			<article className="relative flex w-full flex-col">
				{/* Payload Preview Functions */}
				{isPreview && <RefreshRouteOnSave />}

				{/*
				 * Section Heading — 제목이 이미지 **위에** 정중앙으로 얹힌다(Figma 61:3503).
				 * 🔴 제목 자리에 `dark` 스코프를 선언한다. 히어로는 어두운 브랜드 이미지라
				 *    라이트 팔레트의 near-black 제목이 그대로 묻힌다. 색 이름을 직접 쓰지 않고
				 *    스코프를 뒤집는 것이 색을 주입한 면의 관용이다(blocks/block `surfaceScopeClass`).
				 */}
				<ContentFrame>
					<div className="relative">
						<GuidelineHeaderImage image={topic.headerImage} />
						<div className="dark absolute inset-0 grid place-items-center text-foreground">
							<GuidelineHeader variant={variant} title={topic.title} />
						</div>
					</div>
				</ContentFrame>

				{topic.blocks?.length ? (
					<GuidelineBlocks blocks={topic.blocks} betterEditor={isPreview} />
				) : null}

				<GuidelineHelperSlot />
			</article>
		</GuidelineHelperProvider>
	)
}
