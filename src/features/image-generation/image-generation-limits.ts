/**
 * 생성 요청 상한의 단일 소유 — 라우트 검증·카메라 조정 스키마·스튜디오 편집 계약이 모두 여기서 읽는다.
 * 값의 최종 강제는 서버(zod)가 하고, 계약은 이 목록을 화면에 노출할 선택지로만 옮긴다.
 */

export const IMAGE_PROMPT_MAX_LENGTH = 500

export const IMAGE_BATCH_SIZES = [1, 2, 3, 4] as const

export const IMAGE_BATCH_MAX = IMAGE_BATCH_SIZES[IMAGE_BATCH_SIZES.length - 1]

export const IMAGE_BATCH_DEFAULT = 4

/**
 * 참조 이미지 첨부의 상한과 허용 형식 — 첨부는 저장하지 않고 매 요청 본문에 실려 가므로
 * 저장 이미지 상한(image-data-uri의 MAX_IMAGE_BYTES)보다 낮게 잡는다.
 * 화면의 사전 거절과 라우트의 본문 길이 검증이 같은 값을 읽는다.
 */
export const IMAGE_REFERENCE_UPLOAD_MAX_BYTES = 10_000_000

/** decodeImageDataUri가 실제로 통과시키는 형식과 같아야 한다 — 다르면 화면이 통과시킨 파일을 서버가 거절한다. */
export const IMAGE_REFERENCE_UPLOAD_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
