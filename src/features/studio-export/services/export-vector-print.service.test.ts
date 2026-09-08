import { describe, expect, it } from 'vitest'
import type { VectorScene } from '@/modules/studio-artifact/studio-artifact'
import { exportVectorPrint, VectorPrintTextError } from './export-vector-print.service'

const scene = (primitives: VectorScene['primitives']): VectorScene => ({
	width: 100,
	height: 100,
	background: '#ffffff',
	primitives,
})

describe('exportVectorPrint', () => {
	/**
	 * 🔴 차단 케이스만 있으면 **전면 차단 회귀가 초록으로 통과한다** — 아무것도 못 만들게 되어도
	 * 「막혔다」는 단언은 계속 맞기 때문이다. 정상 씬이 실제로 바이트를 내는지 함께 잠근다.
	 */
	it('정상 씬은 PDF 바이트를 돌려준다', async () => {
		const pdf = await exportVectorPrint({
			ppi: 300,
			scene: scene([
				{ kind: 'rect', x: 0, y: 0, width: 50, height: 50, fill: '#00ad45' },
				{ kind: 'circle', cx: 20, cy: 20, radius: 10, fill: '#003087' },
			]),
		})

		expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-')
		expect(pdf.byteLength).toBeGreaterThan(500)
	})

	/**
	 * 🔴 PDF 어댑터는 서체를 임베드하지 않는 계약이라 `text`를 아무것도 그리지 않고 넘어간다 —
	 * 막지 않으면 제목이 통째로 빠진 파일이 인쇄로 나간다. 리포의 템플릿 12개는 모두 아웃라인에
	 * 성공해서 화면으로는 이 경로를 밟을 수 없다. 그래서 여기서 잠근다.
	 */
	it('윤곽선으로 바꾸지 못한 글줄이 남아 있으면 PDF를 만들지 않는다', async () => {
		await expect(
			exportVectorPrint({
				ppi: 300,
				scene: scene([
					{
						kind: 'text',
						x: 0,
						y: 10,
						text: '빠질 제목',
						fontFamily: 'Pretendard',
						fontSize: 10,
						fill: '#000000',
					},
				]),
			}),
		).rejects.toThrow(VectorPrintTextError)
	})

	it('그룹 안에 숨은 글줄도 찾아낸다', async () => {
		await expect(
			exportVectorPrint({
				ppi: 300,
				scene: scene([
					{
						kind: 'group',
						children: [
							{
								kind: 'text',
								x: 0,
								y: 10,
								text: '빠질 제목',
								fontFamily: 'Pretendard',
								fontSize: 10,
								fill: '#000000',
							},
						],
					},
				]),
			}),
		).rejects.toThrow(VectorPrintTextError)
	})
})
