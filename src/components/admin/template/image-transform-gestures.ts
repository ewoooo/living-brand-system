import type { TemplateNodeConfig } from '@/types/template'

/**
 * 이미지 편집 오버레이의 제스처 → imageTransform 값 매핑(순수 계산).
 * 포인터·레이아웃은 jsdom에서 검증할 수 없으므로 여기가 테스트 가능한 코어다.
 * 모든 좌표는 템플릿 px(화면 px ÷ 캔버스 scale) 기준.
 */
export type ImageTransform = NonNullable<TemplateNodeConfig['imageTransform']>

export interface Point {
	x: number
	y: number
}

export const IDENTITY_TRANSFORM: ImageTransform = { x: 0, y: 0, scale: 1, rotate: 0 }

export const isIdentityTransform = (t: ImageTransform) =>
	t.x === 0 && t.y === 0 && t.scale === 1 && t.rotate === 0

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const roundTo = (value: number, factor: number) => Math.round(value * factor) / factor

/**
 * 슬라이더(#182)와 같은 범위로 clamp — 오버레이와 슬라이더가 서로 다른 값 영역을 만들 수 없다.
 * 반올림은 number input에 긴 부동소수점이 노출되지 않게 하는 표시용(x·y·rotate 0.1, scale 0.01).
 */
export function clampTransform(t: ImageTransform): ImageTransform {
	return {
		x: roundTo(clamp(t.x, -1000, 1000), 10),
		y: roundTo(clamp(t.y, -1000, 1000), 10),
		scale: roundTo(clamp(t.scale, 0.2, 5), 100),
		rotate: roundTo(clamp(t.rotate, -180, 180), 10),
	}
}

/**
 * 이동: 편집 translate는 CSS transform 목록 맨 왼쪽 = 부모(프레임) 좌표계에서 적용되므로,
 * 캐리어가 회전·확대돼 있어도 템플릿 px 델타가 그대로 x/y에 더해진다.
 */
export function panTransform(start: ImageTransform, dx: number, dy: number): ImageTransform {
	return clampTransform({ ...start, x: start.x + dx, y: start.y + dy })
}

/** 확대: 캐리어 중심에서 포인터까지의 거리 비율로 scale을 조정한다. */
export function scaleTransform(
	start: ImageTransform,
	center: Point,
	from: Point,
	to: Point,
): ImageTransform {
	const startDistance = Math.hypot(from.x - center.x, from.y - center.y)
	if (startDistance === 0) return clampTransform(start)
	const factor = Math.hypot(to.x - center.x, to.y - center.y) / startDistance
	return clampTransform({ ...start, scale: start.scale * factor })
}

/** 각도를 [-180, 180)으로 정규화한다(180은 -180으로). */
export function normalizeAngle(deg: number): number {
	return ((((deg + 180) % 360) + 360) % 360) - 180
}

/** 회전: 캐리어 중심 기준 포인터 각도 변화량을 더한다. 0° 근처(±3°)는 스냅 — 수평 복귀용. */
export function rotateTransform(
	start: ImageTransform,
	center: Point,
	from: Point,
	to: Point,
): ImageTransform {
	const angle = (p: Point) => (Math.atan2(p.y - center.y, p.x - center.x) * 180) / Math.PI
	const next = normalizeAngle(start.rotate + angle(to) - angle(from))
	return clampTransform({ ...start, rotate: Math.abs(next) <= 3 ? 0 : next })
}
