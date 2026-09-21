import type {
	ImageAspectRatio,
	ImageOutputSize,
} from '@/features/image-generation/domain/image-size'

/**
 * 좌측 갤러리가 그리는 생성 이미지 한 장.
 *
 * 🔴 복원 값이 전부 nullable인 것은 실수가 아니다 — `generated-images`의 메타 필드는
 *    manager 전용 field access를 갖는다(컬렉션 선언). 권한이 없는 사용자에게는 Payload가
 *    그 필드를 빼고 내려주므로, 갤러리는 그림만 보이고 복원은 열리지 않는다.
 *    그 경계를 조회에서 우회하지 않는다(`overrideAccess: false`).
 */
export interface GeneratedImageHistoryItem {
	id: number
	url: string
	createdAt: string
	profileId: number | null
	profileName: string | null
	prompt: string | null
	aspectRatio: ImageAspectRatio | null
	imageSize: ImageOutputSize | null
}

/** 컨트롤러를 채울 수 있는 항목인가 — 프로파일과 프롬프트가 함께 있어야 복원이 성립한다. */
export function acceptsHistoryRestore(
	item: GeneratedImageHistoryItem,
): item is GeneratedImageHistoryItem & { profileId: number; prompt: string } {
	return typeof item.profileId === 'number' && typeof item.prompt === 'string'
}
