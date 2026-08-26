import { ContentFrame } from '@/components/shared/content-frame'
import type { GetGuidelineTopicOutput } from '../../services/get-guideline-topic.service'
import { GuidelineHeader, GuidelineHeaderImage } from '../globals/guideline-header'
import { GuidelineHelperProvider, GuidelineHelperSlot } from '../globals/guideline-helper'
import type { GuidelineVariant } from '../globals/guideline-variant'
import { GuidelineBlocks } from '../guideline-blocks'
import { RefreshRouteOnSave } from '../refresh-route-on-save'
import { ScrollToPreviewDocument } from '../scroll-to-preview-document'
import { GuidelinePage } from './guideline-page'

/**
 * 토픽 한 화면 — 머리(이미지 + 제목)와 Page 목록. 디자인 정본은 Figma HD_LBS_UI 61:3376.
 *
 * 🔑 **토픽 블록은 값이 있을 때만 그린다**(2026-08-21 되살림). 2026-08-18에는 14개 토픽 어디에도
 *    값이 없어 빈 계층이었고 그래서 렌더를 걷어냈다. 지금은 쓰임이 생겼다 — 토픽 맨 위, 하위 Page의
 *    제목보다 앞에 놓이는 히어로다(자회사·해외지사 CI). 그 자리는 Page 블록으로는 만들 수 없다
 *    (Page는 제목이 필수라 제목 없는 첫 Page를 둘 수 없다).
 * 🔴 그때의 교훈은 남긴다 — **빈 배열이면 아무 계층도 만들지 않는다.** 옛 구현은 제목과 묶으려고
 *    래핑을 두 겹 더 세웠고, 값이 없는 토픽에서 그것이 그대로 빈 상자로 남았다.
 *
 * 🔴 토픽 **설명**도 그리지 않는다. 같은 조사에서 전 토픽이 비어 있었고, 2열 hgroup의 오른쪽 칸이
 *    항상 빈 채로 폭만 차지했다. Figma의 Section Heading도 제목 하나뿐이다.
 */
export function GuidelineTopic({
	topic,
	previewDocumentId,
}: {
	topic: GetGuidelineTopicOutput
	previewDocumentId?: number
}) {
	const variant = 'topic' satisfies GuidelineVariant
	const previewedPage = topic.pages.find((page) => page.id === previewDocumentId)

	return (
		// Helper(하단 Floating Controller)의 provider와 자리는 이 <article> 하나가 감싼다 —
		// 컨트롤을 가진 블록이 전부 이 안에 있고, 알약이 본문 폭 기준으로 가운데에 서야 하기 때문이다.
		<GuidelineHelperProvider>
			<article className="relative flex w-full flex-col">
				{/* Payload Preview Functions */}
				{previewDocumentId !== undefined && <RefreshRouteOnSave />}
				{previewedPage && <ScrollToPreviewDocument targetId={previewedPage.slug} />}

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

				{topic.blocks?.length ? <GuidelineBlocks blocks={topic.blocks} /> : null}

				{/*
				 * Page 목록 — Figma의 Article 스택. 앞 Page의 면 끝에서 다음 Page의 제목까지
				 * 288 + 32(제목 프레임 위 패딩) = 320이고, Figma는 326이다(250 + 16 + 60).
				 * 🔴 6px 차이는 남겨 둔다 — 294는 간격 스케일 밖이라 이 한 자리를 위해 임의값을
				 *    들이면 다음 사람이 그것을 근거로 또 임의값을 쓴다.
				 */}
				<section className="flex flex-col gap-72" aria-label="guideline-pages">
					{topic.pages.map((page) => (
						<GuidelinePage
							key={page.id}
							page={page}
							betterEditor={page.id === previewDocumentId}
						/>
					))}
				</section>

				<GuidelineHelperSlot />
			</article>
		</GuidelineHelperProvider>
	)
}
