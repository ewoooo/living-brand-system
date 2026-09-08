import { IMAGE_RATIO_CLASS_NAMES, IMAGE_RATIO_OPTIONS, type ImageRatio } from '@/types/image-ratio'

/**
 * 디스플레이 비율은 **규격 타입**이다 — 자유값이 없다(사용자 지정 2026-09-07). 공용 비율 어휘에서
 * "원본"만 뺀다. 원본은 규격이 아니라 "이미지가 정한다"는 뜻이어서 카드 판의 크기를 미리 말할 수 없다.
 */
export const CARD_RATIO_OPTIONS = IMAGE_RATIO_OPTIONS.filter(
	(option) => option.value !== 'original',
)
export type CardRatio = Exclude<ImageRatio, 'original'>
export const CARD_RATIO_CLASS: Record<CardRatio, string> = Object.fromEntries(
	Object.entries(IMAGE_RATIO_CLASS_NAMES).filter(([key]) => key !== 'original'),
) as Record<CardRatio, string>
