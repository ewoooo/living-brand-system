import { IMAGE_EDIT_TRANSFORM_LIMITS } from '@/services/compose-template-html.client'

/**
 * 패드 정규 좌표(-1~1)와 compose imageTransform(px) 사이의 변환 —
 * 값 범위 계약은 compose 서비스(IMAGE_EDIT_TRANSFORM_LIMITS)가 소유하고 여기서는 환산만 한다.
 * 외부 I/O 없음.
 */

export type ImageTransformValue = {
	/** 슬롯 중심 기준 오프셋, -1(왼/위) ~ 1(오른/아래). */
	x: number
	y: number
	scale: number
	rotate: number
}

export const IMAGE_TRANSFORM_DEFAULT: ImageTransformValue = { x: 0, y: 0, scale: 1, rotate: 0 }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * 패드 정규 좌표를 compose의 imageTransform(템플릿 px) 값으로 바꾼다.
 * 패드 한끝 = 슬롯 박스 절반 이동. clamp ±1000은 어드민 제스처(clampTransform)와 같은 상한.
 */
export function toImageEditTransform(
	value: ImageTransformValue,
	boxWidth: number,
	boxHeight: number,
): ImageTransformValue {
	const { translate } = IMAGE_EDIT_TRANSFORM_LIMITS
	return {
		x: clamp(Math.round((value.x * boxWidth) / 2), translate.min, translate.max),
		y: clamp(Math.round((value.y * boxHeight) / 2), translate.min, translate.max),
		scale: value.scale,
		rotate: value.rotate,
	}
}
