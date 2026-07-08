import type { ApplicationImage } from '@/payload-types'

/** 빈/공백 문자열을 제거한다. agent 평문 조립용. */
export function compact(values: (string | null | undefined)[]): string[] {
	return values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))
}

/** ApplicationImage에서 agent가 읽을 식별 텍스트(alt·name·url)를 뽑는다. */
export function formatImage(value: unknown): string {
	if (!value || typeof value !== 'object') {
		return ''
	}

	const image = value as Partial<ApplicationImage>
	return compact([image.alt, image.name, image.url]).join(' ')
}
