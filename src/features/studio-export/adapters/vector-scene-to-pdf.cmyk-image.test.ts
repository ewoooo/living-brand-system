// @vitest-environment node
// 🔴 jsdom에서는 pdf-lib이 node Buffer를 자기 realm의 Uint8Array로 못 알아봐 이미지 임베드가
//    타입 오류로 죽는다. 제품은 서버(node)에서만 도는 경로라 이 파일만 node 환경으로 돈다.
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import type { VectorScene } from '@/modules/studio-artifact/studio-artifact'
import { readCmykIccProfile, resolveCmykIccProfilePath } from '../color-profile.server'
import { vectorSceneToPdf } from './vector-scene-to-pdf.pdf-lib'

/**
 * 🔴 APP14 Adobe 마커가 붙은 CMYK JPEG은 샘플을 반전해 저장하고, PDF 리더는 그 마커를 보지
 * 않는다 — 되뒤집는 일은 `Decode [1 0 …]`이 한다. 이 배열을 지우면 초록이 검정으로, 파랑이
 * 노랑으로 열린다(2026-09-09 실측). JPEG 자체는 정상이라 파일만 열어 보면 결함이 안 보이고
 * PDF 안에서만 드러나므로, 「불필요한 배열」로 보여 지워지기 쉽다. 그래서 여기서 잠근다.
 */
describe('CMYK 이미지의 Decode 배열', () => {
	it('지워지지 않는다', async () => {
		// 🔴 4KB를 넘겨야 한다 — 그 아래 JPEG은 pdf-lib이 byteOffset을 무시해 embed가 터진다.
		//    평탄한 색은 너무 작게 압축되므로 노이즈로 채운다.
		const raw = Buffer.alloc(200 * 200 * 3)
		let state = 1
		for (let index = 0; index < raw.length; index++) {
			state = (state * 1103515245 + 12345) & 0x7fffffff
			raw[index] = (state >>> 16) & 255
		}
		const jpeg = await sharp(raw, { raw: { channels: 3, height: 200, width: 200 } })
			.withIccProfile(resolveCmykIccProfilePath('cgats21-crpc6'), { attach: false })
			.jpeg({ quality: 100 })
			.toBuffer()
		expect((await sharp(jpeg).metadata()).space).toBe('cmyk')
		expect(jpeg.byteLength).toBeGreaterThan(4096)

		const scene: VectorScene = {
			width: 100,
			height: 100,
			background: '#ffffff',
			primitives: [
				{
					kind: 'image',
					x: 0,
					y: 0,
					width: 50,
					height: 50,
					colorSpace: 'cmyk',
					href: `data:image/jpeg;base64,${jpeg.toString('base64')}`,
				},
			],
		}
		const pdf = await vectorSceneToPdf(scene, {
			cmyk: {
				colors: new Map(),
				iccProfile: await readCmykIccProfile('cgats21-crpc6'),
				iccProfileName: 'cgats21-crpc6',
			},
			ppi: 150,
		})

		const doc = await PDFDocument.load(pdf)
		const images = doc.context
			.enumerateIndirectObjects()
			.map(([, object]) => object)
			.filter(
				(object): object is PDFRawStream =>
					object instanceof PDFRawStream &&
					String(object.dict.get(PDFName.of('Subtype'))) === '/Image',
			)
		expect(images).toHaveLength(1)
		expect(String(images[0].dict.get(PDFName.of('Decode')))).toBe('[ 1 0 1 0 1 0 1 0 ]')
	})
})
