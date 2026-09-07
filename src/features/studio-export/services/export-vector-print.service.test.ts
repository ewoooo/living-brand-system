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
