import type { VectorScene } from '@/modules/studio-artifact/studio-artifact'
import { type CmykColor, convertRgbToCmyk } from '../adapters/rgb-to-cmyk.sharp'
import { convertSceneImagesToCmyk } from '../adapters/scene-images-to-cmyk.sharp'
import {
	collectSceneColors,
	parseColor,
	vectorSceneToPdf,
} from '../adapters/vector-scene-to-pdf.pdf-lib'
import { readCmykIccProfile, resolveCmykIccProfilePath } from '../color-profile.server'
import type { CmykIccProfile } from '../export-contract'
import type { PrintPpi } from '../print-policy'
import { listBrandInks } from '../repositories/brand-ink.payload.repository'

export class VectorPrintInputError extends Error {}

/**
 * 윤곽선으로 바꾸지 못한 글줄이 씬에 남아 있다.
 * 🔴 PDF 어댑터는 서체를 임베드하지 않는 계약이라 `text`를 **아무것도 그리지 않고 넘어간다** —
 *    막지 않으면 제목이 통째로 빠진 파일이 인쇄로 나간다. 인쇄물은 되돌릴 수 없으므로 여기서 끊는다.
 */
export class VectorPrintTextError extends Error {}

/**
 * 씬의 색 하나를 CMYK로 바꿀 수 없다.
 * 🔴 막지 않으면 그 도형만 RGB로 나가고 파일이 RGB·CMYK 혼재가 된다 — Illustrator가 문서 모드를
 *    하나 골라 나머지를 변환하므로, **정본 CMYK 수치가 그 순간 통째로 깨진다**(2026-09-09 실측).
 *    인쇄물은 되돌릴 수 없으니 여기서 끊는다.
 */
export class VectorPrintColorError extends Error {}

/**
 * 투명이 있어 CMYK로 바꿀 수 없는 이미지가 씬에 있다.
 * 🔴 CMYK JPEG는 알파를 담지 못한다. 흰색으로 눌러 담으면 마스크로 오려 낸 레이어가 불투명
 *    사각형으로 되살아나고, RGB로 남기면 파일이 혼재가 되어 정본 CMYK 수치가 깨진다. 둘 다
 *    인쇄 사고이므로 여기서 끊는다.
 */
export class VectorPrintImageError extends Error {}

/** 판 하나가 가질 수 있는 도형 수 상한. 넘으면 템플릿이 아니라 잘못된 입력이다. */
const MAX_PRIMITIVES = 20_000

/**
 * Vector Scene을 인쇄용 PDF로 만든다. pdf-lib I/O는 adapter가 소유한다.
 *
 * 도형 색은 **브랜드 정본이 지정한 잉크값**으로 찍는다. 정본이 말하지 않는 색만 ICC로 계산한다.
 * 🔴 정본 값을 검사하거나 보정하지 않는다 — 총 잉크량이 상한을 넘든 순수 검정을 안 쓰든 그대로
 *    옮긴다. 인쇄 사고가 나면 고칠 곳은 코드가 아니라 가이드라인이다(사용자 지시, 2026-09-09).
 * 🔴 **파일 전체가 CMYK 하나여야 한다**(사용자 지시, 2026-09-09). 도형·선·배경뿐 아니라 사진까지
 *    바꾸고, 못 바꾸는 것이 하나라도 있으면 PDF를 만들지 않는다 — 혼재된 파일을 Illustrator가
 *    열면 문서 모드를 하나 골라 나머지를 변환하므로 정본 수치가 통째로 깨진다.
 * 🔑 `colorProfile`이 없으면 RGB로 낸다 — 인쇄 프로파일을 갖는 것은 템플릿이고, 안 준 판을
 *    임의로 CMYK로 바꾸지 않는다.
 */
export async function exportVectorPrint({
	colorProfile,
	ppi,
	scene,
}: {
	colorProfile?: CmykIccProfile
	/** 씬의 px 좌표를 물리 크기로 읽는 해상도. PDF 페이지 치수가 여기서 나온다. */
	ppi: PrintPpi
	scene: VectorScene
}): Promise<Buffer> {
	if (countPrimitives(scene) > MAX_PRIMITIVES) throw new VectorPrintInputError()
	const unoutlined = countTextPrimitives(scene)
	if (unoutlined > 0) throw new VectorPrintTextError(String(unoutlined))

	if (!colorProfile) return vectorSceneToPdf(scene, { ppi })

	// 🔴 사진을 먼저 CMYK로 바꾼다. RGB로 남으면 파일이 혼재가 되고, Illustrator가 문서 모드를
	//    하나 골라 나머지를 변환하면서 **도형의 정본 CMYK 수치까지 통째로 깨진다**(2026-09-09 실측).
	const icc = resolveCmykIccProfilePath(colorProfile)
	const converted = await convertSceneImagesToCmyk(scene, icc)
	if (converted.keptRgb > 0) throw new VectorPrintImageError(String(converted.keptRgb))
	const cmykScene = converted.scene

	const canon = await listBrandInks()
	// 어댑터는 씬에 적힌 표기 그대로 잉크를 찾으므로, 키는 원본 표기이고 값만 정규화한 hex로 잰다.
	const colors = new Map<string, CmykColor>()
	const toCompute = new Map<string, string>()
	const unconvertible: string[] = []
	for (const value of collectSceneColors(cmykScene)) {
		const key = value.toLowerCase()
		// 🔴 `#f0a`·`rgb(0,175,65)`처럼 씬이 관용적으로 허용하는 표기를 먼저 `#rrggbb`로 펴야 한다.
		//    안 펴면 ICC 변환기의 hex 필터에서 조용히 탈락해 그 색만 RGB로 나갔다.
		const hex = normalizeHex(value)
		if (!hex) {
			unconvertible.push(value)
			continue
		}
		// 정본은 표기가 축약이어도 이긴다 — 정규화한 hex로 찾으므로 `rgb(0,175,65)`도 정본에 걸린다.
		const ink = canon.get(hex)
		if (ink) colors.set(key, ink)
		else toCompute.set(key, hex)
	}

	const computed = await convertRgbToCmyk([...new Set(toCompute.values())], icc)
	for (const [key, hex] of toCompute) {
		const ink = computed.get(hex)
		if (ink) colors.set(key, ink)
		else unconvertible.push(key)
	}
	if (unconvertible.length > 0) throw new VectorPrintColorError(String(unconvertible.length))

	return vectorSceneToPdf(cmykScene, {
		cmyk: {
			colors,
			iccProfile: await readCmykIccProfile(colorProfile),
			iccProfileName: colorProfile,
		},
		ppi,
	})
}

/** 씬이 허용하는 색 표기를 `#rrggbb` 하나로 편다. 못 읽는 표기는 `undefined`. */
function normalizeHex(value: string): string | undefined {
	const color = parseColor(value)
	if (!color) return undefined
	const channel = (component: number) =>
		Math.round(component * 255)
			.toString(16)
			.padStart(2, '0')
	return `#${channel(color.red)}${channel(color.green)}${channel(color.blue)}`
}

/** 아웃라인 단계를 통과하지 못해 `text`로 남은 글줄 수. 0이 아니면 PDF를 만들지 않는다. */
function countTextPrimitives(scene: VectorScene): number {
	const count = (primitives: readonly VectorScene['primitives'][number][]): number =>
		primitives.reduce(
			(total, primitive) =>
				total +
				(primitive.kind === 'text' ? 1 : 0) +
				(primitive.kind === 'group' ? count(primitive.children) : 0),
			0,
		)
	return count(scene.primitives)
}

function countPrimitives(scene: VectorScene): number {
	const count = (primitives: readonly VectorScene['primitives'][number][]): number =>
		primitives.reduce(
			(total, primitive) =>
				total + 1 + (primitive.kind === 'group' ? count(primitive.children) : 0),
			0,
		)
	return count(scene.primitives)
}
