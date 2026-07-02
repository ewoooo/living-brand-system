/**
 * 로고 형태 동일성 비교 (순수). 검출 실루엣을 정답 에셋 실루엣과 직접 겹쳐 비교한다.
 * transform에 불변이 아니라 민감 — 반전·비율변경·수정을 fail로 잡기 위한 misuse 판정 재료.
 * (회전은 다루지 않음: upright 입력 전제.) 픽셀 I/O·SVG 래스터화는 상위 레이어가 소유한다.
 */

// 정규화 정사각 캔버스 한 변(px). 검출·에셋 실루엣을 이 해상도로 맞춰 겹친다.
export const NORM_SIZE = 128
// 종횡비 허용 오차 — 이보다 벌어지면 비율변경(stretch)으로 보고 즉시 탈락.
const ASPECT_TOL = 0.2
// IoU 임계 — 이 이상 겹치면 동일 패스로 본다. (래스터/다운샘플 노이즈 여유, 픽스처로 검증)
const IOU_TOL = 0.7

export interface NormalizedSilhouette {
	size: number
	/** N×N 이진 마스크 (row-major), 1=전경 */
	mask: Uint8Array
}

export interface LogoAsset {
	key: string
	/** bbox 종횡비 (w/h) */
	aspect: number
	silhouette: NormalizedSilhouette
}

export interface ShapeMatch {
	/** 가장 잘 맞는 에셋 key (aspect 게이트 통과분 중). 통과분 없으면 null */
	key: string | null
	iou: number
	/** 매칭 에셋과의 종횡비 상대 차 (게이트 판정에 쓴 값) */
	aspectDiff: number
	pass: boolean
}

interface Bbox {
	x0: number
	y0: number
	x1: number
	y1: number
}

/**
 * 전경 마스크를 bbox로 크롭해 긴 변을 N에 맞춰(비율 보존) 정사각 캔버스 중앙에 정규화한다.
 * 위치·균일 스케일은 흡수하고, 형태·비율 차이는 보존한다.
 */
export function normalizeSilhouette(
	mask: Uint8Array,
	srcWidth: number,
	bbox: Bbox,
	size = NORM_SIZE,
): NormalizedSilhouette {
	const bw = bbox.x1 - bbox.x0 + 1
	const bh = bbox.y1 - bbox.y0 + 1
	const scale = size / Math.max(bw, bh)
	const outW = Math.max(1, Math.round(bw * scale))
	const outH = Math.max(1, Math.round(bh * scale))
	const offX = Math.floor((size - outW) / 2)
	const offY = Math.floor((size - outH) / 2)

	const out = new Uint8Array(size * size)
	for (let oy = 0; oy < outH; oy++) {
		const srcY = bbox.y0 + Math.min(bh - 1, Math.floor(oy / scale))
		for (let ox = 0; ox < outW; ox++) {
			const srcX = bbox.x0 + Math.min(bw - 1, Math.floor(ox / scale))
			if (mask[srcY * srcWidth + srcX]) out[(offY + oy) * size + (offX + ox)] = 1
		}
	}
	return { size, mask: out }
}

/** 같은 크기 두 이진 마스크의 IoU (교집합/합집합). 둘 다 비면 1. */
export function maskIoU(a: Uint8Array, b: Uint8Array): number {
	let inter = 0
	let union = 0
	for (let i = 0; i < a.length; i++) {
		const av = a[i]
		const bv = b[i]
		if (av || bv) union++
		if (av && bv) inter++
	}
	return union === 0 ? 1 : inter / union
}

/**
 * 검출 실루엣을 승인 에셋들과 비교한다.
 * 먼저 종횡비 게이트(비율변경 컷)를 통과한 에셋에 한해 IoU로 최적 매칭을 고른다.
 * 반전·수정은 겹침이 무너져 IoU가 임계 아래로 떨어진다.
 */
export function matchLogo(
	detected: NormalizedSilhouette,
	detectedAspect: number,
	assets: LogoAsset[],
): ShapeMatch {
	const best: ShapeMatch = { key: null, iou: 0, aspectDiff: Number.POSITIVE_INFINITY, pass: false }
	for (const asset of assets) {
		const aspectDiff = Math.abs(detectedAspect - asset.aspect) / asset.aspect
		if (aspectDiff > ASPECT_TOL) continue
		const iou = maskIoU(detected.mask, asset.silhouette.mask)
		if (iou > best.iou) {
			best.key = asset.key
			best.iou = iou
			best.aspectDiff = aspectDiff
			best.pass = iou >= IOU_TOL
		}
	}
	return best
}
