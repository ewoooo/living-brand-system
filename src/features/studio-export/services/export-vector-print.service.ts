import type { VectorScene } from '@/modules/studio-artifact/studio-artifact'
import { vectorSceneToPdf } from '../adapters/vector-scene-to-pdf.pdf-lib'
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
 * Vector Scene을 인쇄용 PDF로 만든다. pdf-lib I/O는 adapter가 소유한다.
 *
 * 🔴 **지금은 CMYK로 바꾸지 않는다.** PDF 안의 CMYK 이미지가 Illustrator에서 반전돼 열리는
 *    알려진 결함(pdf-lib·jsPDF·Prawn 공통, Adobe 미해결) 때문에 RGB로 낸다 — 화면·SVG와 같은
 *    그림이 열리는 것이 우선이다. 근거는 `png-to-pdf.pdf-lib`의 주석이 갖는다.
 * 🔑 `colorProfile` 인자는 계약이 이미 실어 보내므로 남겨 둔다 — 색 관리를 되돌릴 때 이 자리가
 *    출발점이다. 지금은 읽고 버린다.
 */
export async function exportVectorPrint({
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

	return vectorSceneToPdf(scene, { ppi })
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
