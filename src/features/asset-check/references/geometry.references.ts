import type { CanvasFormat } from '@/features/asset-check/checkers/geometry/canvas-format'

export interface AspectRatioFormat {
	label: string
	ratio: number
}

export const STATIONERY_FORMAT_RATIOS: AspectRatioFormat[] = [
	{ label: '명함 90×50mm', ratio: 90 / 50 },
	{ label: '리플렛 A4 210×297mm', ratio: 297 / 210 },
	{ label: '제품 정보 카드 A5 148×210mm', ratio: 210 / 148 },
]

export const ADVERTISEMENT_FORMATS: CanvasFormat[] = [
	{ label: '16:9', width: 16, height: 9 },
	{ label: '3:4', width: 3, height: 4 },
	{ label: '3:1', width: 3, height: 1 },
	{ label: '1:1', width: 1, height: 1 },
	{ label: '1:2', width: 1, height: 2 },
	{ label: 'Offline 1440×2100mm', width: 1440, height: 2100 },
	{ label: 'Offline 2400×1600mm', width: 2400, height: 1600 },
	{ label: 'Offline 8600×2100mm', width: 8600, height: 2100 },
]

export const ADVERTISEMENT_TEMPLATE_FORMATS: CanvasFormat[] = [
	{ label: 'Offline Vertical 1440×2100mm', width: 1440, height: 2100 },
	{ label: 'Offline Horizontal 2400×1600mm', width: 2400, height: 1600 },
	{ label: 'Offline Horizontal(long) 8600×2100mm', width: 8600, height: 2100 },
]

export const SNS_FORMATS: CanvasFormat[] = [
	{ label: 'Feed 1080×1440px', width: 1080, height: 1440 },
	{ label: 'Reels 1080×1920px', width: 1080, height: 1920 },
]

export const SNS_CANVAS_FORMATS: CanvasFormat[] = [
	{ label: '3:5(SNS) 1080×1440px', width: 1080, height: 1440 },
]

export const VISUAL_TEMPLATE_FORMATS: CanvasFormat[] = [
	{ label: '1:1 1080×1080px', width: 1, height: 1 },
	{ label: '3:5(SNS) 1080×1440px', width: 1080, height: 1440 },
	{ label: 'A4 210×297mm', width: 210, height: 297 },
	{ label: '3:1 1920×640px', width: 3, height: 1 },
	{ label: '16:9 1920×1080px', width: 16, height: 9 },
]

export const WEB_FORMATS: CanvasFormat[] = [
	{ label: '16:9 1920×1080px', width: 16, height: 9 },
	{ label: '3:1 1920×640px', width: 3, height: 1 },
]
