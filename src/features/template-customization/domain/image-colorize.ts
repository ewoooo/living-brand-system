import {
	getImageColorAdjustmentControls,
	type ImageStudioConfig,
} from '@/features/image-generation/domain/image-studio-config'
import type { TemplateAssignedImage } from '@/features/template-customization/contexts/template-studio-context'

/**
 * 슬롯에 배정된 이미지가 색 치환을 받을 수 있는지 판정해 컨트롤을 돌려준다.
 *
 * 색 치환은 라인 아트에만 뜻이 있다 — 사진에 걸면 두 색으로 뭉개진다. 그래서 생성물은
 * 그 프로파일이 만든 것일 때, 샘플은 선화로 표시된 것일 때만 연다. 아직 아무것도 배정되지
 * 않았으면 저작 이미지가 그려지므로 열어 둔다(템플릿에 박힌 선화가 대상이다).
 *
 * 🔴 판정을 호출부에 복제하지 말 것 — 컨트롤을 그리는 UI와 override를 만드는 런타임이
 * 같은 답을 봐야 한다. 한쪽만 고치면 손잡이 없는 색이나 먹히지 않는 손잡이가 생긴다.
 */
export function resolveTemplateImageColorControls(
	state: { profileId?: number; image?: TemplateAssignedImage },
	config: ImageStudioConfig,
) {
	const colorizable =
		!state.image ||
		(state.image.kind === 'generated' && state.image.profileId === state.profileId) ||
		(state.image.kind === 'sample' && state.image.lineArt)
	return colorizable ? getImageColorAdjustmentControls(config) : null
}
