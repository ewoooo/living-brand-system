export interface ImageContentFlags {
	logo: boolean
	typography: boolean
	illustration: boolean
	photography: boolean
}

export const DEFAULT_CONTENT_FLAGS: ImageContentFlags = {
	logo: false,
	typography: false,
	illustration: false,
	photography: false,
}

export const CONTENT_FLAG_LABELS: Record<keyof ImageContentFlags, string> = {
	logo: 'Logo',
	typography: 'Typography',
	illustration: 'Illustration',
	photography: 'Photography',
}
