import config from '@payload-config'
import { getPayload } from 'payload'
import { listGraphicStudioConfigs } from '@/features/graphic-generation/services/list-graphic-studio-configs.service'
import { listImageStudioConfigs } from '@/features/image-generation/services/list-image-studio-configs.service'
import {
	deriveTemplateStudioConfig,
	type PublishedTemplateView,
	type TemplateStudioConfig,
} from '@/features/template-customization/domain/template-studio-config'
import { getPublishedTemplate } from '@/features/template-customization/services/get-published-template.service'

export type GetTemplateStudioOutput = {
	config: TemplateStudioConfig
	template: PublishedTemplateView
	/** 캔버스에서 편집 중인 슬롯을 집어 보여 줄 때 쓰는 색. 못 찾으면 null이고 화면이 폴백한다. */
	highlightColor: string | null
}

/**
 * 강조에 쓰는 브랜드 색 이름. CI 워드마크와 같은 색이다 — 「이 브랜드의 색」으로 읽히는 자리라
 * 임의 색을 열지 않고 하나로 못 박는다.
 * 🔴 hex를 코드에 박지 않는다 — 브랜드 색이 바뀌면 컬렉션만 고치면 되게 이름으로 찾는다
 *    (`docs/09` §4의 색-데이터 예외이고, `ci-lockup` 위젯이 같은 규칙을 쓴다).
 */
const HIGHLIGHT_COLOR_NAME = 'HD DISCOVERY BLUE'

/** DB에서 온 문자열이 그대로 CSS 선언에 들어가는 자리다 — hex 형태만 통과시킨다. */
function safeHex(value: unknown): string | null {
	return typeof value === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : null
}

/**
 * 색을 못 찾아도 스튜디오는 열려야 한다 — 강조 색 하나가 편집기를 죽이지 않게 한다.
 * 🔑 `ci-lockup` 위젯의 `brandColors()`와 같은 모양이다(이름 조회 + 실패 시 빈 값).
 */
async function highlightColor(): Promise<string | null> {
	try {
		const payload = await getPayload({ config })
		const { docs } = await payload.find({
			collection: 'brand-colors',
			where: { name: { equals: HIGHLIGHT_COLOR_NAME } },
			depth: 0,
			limit: 1,
			select: { hex: true },
			overrideAccess: true,
		})
		return safeHex(docs[0]?.hex)
	} catch {
		return null
	}
}

/**
 * 유스케이스 경계: 템플릿 스튜디오 열기.
 * published 템플릿과 참조 Image·Graphic Config(각 소유 feature의 공개 서비스)를 조합해
 * Effective TemplateStudioConfig를 파생한다. Payload 원본과 Admin 정책은 이 서비스 밖으로
 * 나가지 않는다 — 클라이언트에는 PublishedTemplateView만 반환한다.
 * 호출자(페이지)가 requireUser로 인증을 보장한다 — 비회원 분기는 여기 두지 않는다.
 */
export async function getTemplateStudio(
	templateSlug: string,
	user: unknown,
): Promise<GetTemplateStudioOutput | null> {
	const [published, imageConfigs, graphicConfigs, highlight] = await Promise.all([
		getPublishedTemplate(templateSlug),
		listImageStudioConfigs(user),
		listGraphicStudioConfigs(user),
		highlightColor(),
	])

	if (!published) return null

	const { id, name, html, width, height } = published
	return {
		config: deriveTemplateStudioConfig(published, imageConfigs, graphicConfigs),
		template: { id, name, html, width, height },
		highlightColor: highlight,
	}
}
