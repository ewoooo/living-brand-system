import type { VectorScene } from '@/modules/studio-artifact/studio-artifact'
import { convertRgbToCmyk } from '../adapters/rgb-to-cmyk.sharp'
import { collectSceneColors, vectorSceneToPdf } from '../adapters/vector-scene-to-pdf.pdf-lib'
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

/** 판 하나가 가질 수 있는 도형 수 상한. 넘으면 템플릿이 아니라 잘못된 입력이다. */
const MAX_PRIMITIVES = 20_000

/**
 * Vector Scene을 인쇄용 PDF로 만든다. pdf-lib I/O는 adapter가 소유한다.
 *
 * 도형 색은 **브랜드 정본이 지정한 잉크값**으로 찍는다. 정본이 말하지 않는 색만 ICC로 계산한다.
 * 🔴 정본 값을 검사하거나 보정하지 않는다 — 총 잉크량이 상한을 넘든 순수 검정을 안 쓰든 그대로
 *    옮긴다. 인쇄 사고가 나면 고칠 곳은 코드가 아니라 가이드라인이다(사용자 지시, 2026-09-09).
 * 🔴 **사진은 아직 RGB로 남는다.** 씬의 `image`를 CMYK로 바꾸려면 `colorSpace: 'cmyk'`를 채워야
 *    하는데, PDF 안의 CMYK 이미지가 Illustrator에서 반전돼 열리는 결함이 아직 실물로 확인되지
 *    않았다. 도형만 먼저 정본대로 찍는다.
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

	const canon = await listBrandInks()
	// 정본에 없는 색만 계산한다. 브랜드 색을 계산값으로 덮으면 가이드라인과 다른 잉크가 찍힌다.
	const uncanonical = collectSceneColors(scene).filter((hex) => !canon.has(hex.toLowerCase()))
	const computed = await convertRgbToCmyk(uncanonical, resolveCmykIccProfilePath(colorProfile))

	return vectorSceneToPdf(scene, {
		// 정본이 계산값에 덮이지 않게 하는 것은 위의 필터다. 순서는 두 번째 잠금일 뿐이다 —
		// 필터가 이미 겹침을 없애므로 이 줄만 뒤집어도 결과는 같다.
		cmyk: {
			colors: new Map([...computed, ...canon]),
			iccProfile: await readCmykIccProfile(colorProfile),
			iccProfileName: colorProfile,
		},
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
