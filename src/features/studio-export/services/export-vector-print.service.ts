import type { VectorScene } from '@/modules/studio-artifact/studio-artifact'
import { convertRgbToCmyk } from '../adapters/rgb-to-cmyk.sharp'
import { convertSceneImagesToCmyk } from '../adapters/scene-images-to-cmyk.sharp'
import { collectSceneColors, vectorSceneToPdf } from '../adapters/vector-scene-to-pdf.pdf-lib'
import { DEFAULT_CMYK_ICC_PROFILE } from '../color-profile'
import { readCmykIccProfile, resolveCmykIccProfilePath } from '../color-profile.server'
import type { CmykIccProfile } from '../export-contract'
import type { PrintPpi } from '../print-policy'

export class VectorPrintInputError extends Error {}

/**
 * 윤곽선으로 바꾸지 못한 글줄이 씬에 남아 있다.
 * 🔴 PDF 어댑터는 서체를 임베드하지 않는 계약이라 `text`를 **아무것도 그리지 않고 넘어간다** —
 *    막지 않으면 제목이 통째로 빠진 파일이 인쇄로 나간다. 인쇄물은 되돌릴 수 없으므로 여기서 끊는다.
 */
export class VectorPrintTextError extends Error {}

/** 판 하나가 가질 수 있는 도형 수 상한. 넘으면 템플릿이 아니라 잘못된 입력이다. */
const MAX_PRIMITIVES = 20_000

/**
 * Vector Scene을 인쇄용 CMYK PDF로 만든다. 색 변환과 pdf-lib I/O는 각 adapter가 소유한다.
 *
 * 🔑 래스터 인쇄 경로(`export-print.service`)와 **같은 ICC**를 탄다 — 같은 판의 이미지와 도형이
 *    다른 색으로 찍히지 않게 하는 것이 이 서비스가 서버에 있는 이유다.
 */
export async function exportVectorPrint({
	colorProfile = DEFAULT_CMYK_ICC_PROFILE,
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

	const iccPath = resolveCmykIccProfilePath(colorProfile)
	// 🔑 도형만 잉크로 바꾸면 사진이 RGB로 남아 같은 판에서 색이 갈린다 — 둘 다 같은 ICC를 탄다.
	const { scene: inked } = await convertSceneImagesToCmyk(scene, iccPath)
	const colors = await convertRgbToCmyk(collectSceneColors(inked), iccPath)

	return vectorSceneToPdf(inked, {
		colors,
		iccProfile: await readCmykIccProfile(colorProfile),
		iccProfileName: colorProfile,
		ppi,
	})
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
