import type { TemplateNodeConfig } from '@/types/template'

export const IDENTITY_TRANSFORM: NonNullable<TemplateNodeConfig['imageTransform']> = {
	x: 0,
	y: 0,
	scale: 1,
	rotate: 0,
}

export const IMAGE_EDIT_TRANSFORM_LIMITS = {
	translate: { min: -1000, max: 1000 },
	scale: { min: 0.2, max: 5 },
	rotate: { min: -180, max: 180 },
} as const

export function formatImageEditTransform(
	edit: NonNullable<TemplateNodeConfig['imageTransform']>,
): string {
	return `translate(${edit.x}px, ${edit.y}px) scale(${edit.scale}) rotate(${edit.rotate}deg)`
}

export const isIdentityTransform = (transform: NonNullable<TemplateNodeConfig['imageTransform']>) =>
	transform.x === 0 && transform.y === 0 && transform.scale === 1 && transform.rotate === 0
