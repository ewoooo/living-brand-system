import sharp from 'sharp'
import type { VectorPrimitive, VectorScene } from '@/modules/studio-artifact/studio-artifact'
import { MAX_PRINT_PIXELS } from '../print-policy'

/**
 * 씬에 실린 이미지를 대상 ICC의 CMYK로 바꾼다.
 *
 * 🔴 안 바꾸면 도형만 잉크로 들어가고 사진은 DeviceRGB로 남아, **CMYK 출력의도를 단 파일 안에
 *    관리되지 않은 RGB 사진**이 된다. RIP가 제 마음대로 변환하므로 같은 사진이 래스터 인쇄 경로와
 *    다른 색으로 찍힌다 — 이 서비스가 서버에 있는 이유(같은 판의 색을 맞추는 것)가 무너진다.
 * 🔴 **알파가 있는 이미지는 건드리지 않는다.** CMYK JPEG는 투명을 담지 못해서, 변환하면 마스크로
 *    오려 낸 레이어가 다시 불투명 사각형이 된다(고쳐 둔 결함이 되살아난다). 그 레이어는 RGB로 남고
 *    `keptRgb`로 몇 장인지 돌려준다.
 */
export type SceneCmykResult = {
	scene: VectorScene
	converted: number
	/** 알파 때문에 RGB로 남은 이미지 수. 색 관리 밖이라는 뜻이다. */
	keptRgb: number
}

const DATA_URL = /^data:image\/(png|jpeg|jpg);base64,(.+)$/

export async function convertSceneImagesToCmyk(
	scene: VectorScene,
	icc: string,
): Promise<SceneCmykResult> {
	let converted = 0
	let keptRgb = 0

	const walk = async (primitives: readonly VectorPrimitive[]): Promise<VectorPrimitive[]> => {
		const output: VectorPrimitive[] = []
		for (const primitive of primitives) {
			if (primitive.kind === 'group') {
				output.push({ ...primitive, children: await walk(primitive.children) })
				continue
			}
			if (primitive.kind !== 'image') {
				output.push(primitive)
				continue
			}
			const cmyk = await toCmykJpeg(primitive.href, icc)
			if (cmyk) {
				converted += 1
				output.push({ ...primitive, href: cmyk, colorSpace: 'cmyk' })
			} else {
				keptRgb += 1
				output.push(primitive)
			}
		}
		return output
	}

	return { scene: { ...scene, primitives: await walk(scene.primitives) }, converted, keptRgb }
}

/** 알파가 없을 때만 CMYK JPEG로 바꾼다. 못 바꾸면 null이고 호출부가 원본을 유지한다. */
async function toCmykJpeg(href: string, icc: string): Promise<string | null> {
	const match = href.match(DATA_URL)
	if (!match) return null
	try {
		const input = Buffer.from(match[2], 'base64')
		const image = sharp(input, { limitInputPixels: MAX_PRINT_PIXELS })
		const { hasAlpha } = await image.metadata()
		if (hasAlpha) return null
		const output = await image
			.toColourspace('cmyk')
			.withIccProfile(icc)
			.jpeg({ chromaSubsampling: '4:4:4', quality: 95 })
			.toBuffer()
		return `data:image/jpeg;base64,${output.toString('base64')}`
	} catch {
		return null
	}
}
