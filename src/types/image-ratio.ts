/** 이미지 비율을 사용하는 Payload 필드와 화면의 공용 계약. */
export const IMAGE_RATIO_OPTIONS = [
	{ label: '4:3', value: '4:3' },
	{ label: '1:1', value: '1:1' },
	{ label: '16:9', value: '16:9' },
	{ label: '3:2', value: '3:2' },
	{ label: '2:3', value: '2:3' },
	{ label: '4:5', value: '4:5' },
	{ label: '5:4', value: '5:4' },
	{ label: '9:16', value: '9:16' },
] as const

export type ImageRatio = (typeof IMAGE_RATIO_OPTIONS)[number]['value']

// Tailwind가 정적으로 감지해야 하므로 클래스 전체 문자열을 나열한다.
export const IMAGE_RATIO_CLASS_NAMES = {
	'4:3': 'aspect-4/3',
	'1:1': 'aspect-square',
	'16:9': 'aspect-video',
	'3:2': 'aspect-[3/2]',
	'2:3': 'aspect-[2/3]',
	'4:5': 'aspect-[4/5]',
	'5:4': 'aspect-[5/4]',
	'9:16': 'aspect-[9/16]',
} as const satisfies Record<ImageRatio, string>
