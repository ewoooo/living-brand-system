import type { VectorScene } from '@/modules/studio-artifact/studio-artifact'
import { convertRgbToCmyk } from '../adapters/rgb-to-cmyk.sharp'
import { collectSceneColors, vectorSceneToPdf } from '../adapters/vector-scene-to-pdf.pdf-lib'
import { DEFAULT_CMYK_ICC_PROFILE } from '../color-profile'
import { readCmykIccProfile, resolveCmykIccProfilePath } from '../color-profile.server'
import type { CmykIccProfile } from '../export-contract'

export class VectorPrintInputError extends Error {}

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
	scene,
}: {
	colorProfile?: CmykIccProfile
	scene: VectorScene
}): Promise<Buffer> {
	if (countPrimitives(scene) > MAX_PRIMITIVES) throw new VectorPrintInputError()

	const iccPath = resolveCmykIccProfilePath(colorProfile)
	const colors = await convertRgbToCmyk(collectSceneColors(scene), iccPath)

	return vectorSceneToPdf(scene, {
		colors,
		iccProfile: await readCmykIccProfile(colorProfile),
		iccProfileName: colorProfile,
	})
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
