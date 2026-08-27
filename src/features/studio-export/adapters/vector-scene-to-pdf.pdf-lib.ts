import { PDFDocument, type PDFPage, rgb } from 'pdf-lib'
import type { VectorPrimitive, VectorScene } from '@/modules/studio-artifact/studio-artifact'

/**
 * Vector Scene을 단일 페이지 벡터 PDF로 직렬화한다. 인쇄용 내보내기의 최종 어댑터다.
 *
 * 🔑 글자는 여기 오기 전에 이미 윤곽선 path다(`outline-vector-scene`). 그래서 **서체를 임베드하지
 *    않는다** — 인쇄소가 서체를 갖고 있지 않아도 되고 라이선스도 따라오지 않는다.
 * 🔴 씬은 y가 아래로, PDF는 y가 위로 자란다. 페이지 전체를 뒤집으면 이미지와 path가 **두 번**
 *    뒤집히므로(pdf-lib의 `drawSvgPath`가 이미 y를 아래로 읽는다) 프리미티브마다 명시적으로 옮긴다.
 * 🔴 pdf-lib은 그라디언트·그림자·블러를 그리지 못한다. 그런 노드는 씬에 오기 전에 래스터로 바뀌어
 *    `image`로 들어와야 한다(워커의 `unsupported`가 그 목록이다).
 */
export async function vectorSceneToPdf(scene: VectorScene): Promise<Buffer> {
	const pdf = await PDFDocument.create()
	const page = pdf.addPage([scene.width, scene.height])

	page.drawRectangle({
		color: parseColor(scene.background) ?? rgb(1, 1, 1),
		height: scene.height,
		width: scene.width,
		x: 0,
		y: 0,
	})
	for (const primitive of scene.primitives) await draw(pdf, page, primitive, scene.height)

	return Buffer.from(await pdf.save())
}

async function draw(
	pdf: PDFDocument,
	page: PDFPage,
	primitive: VectorPrimitive,
	sceneHeight: number,
): Promise<void> {
	/** 씬 좌표(위에서 아래)를 PDF 좌표(아래에서 위)로. `boxHeight`는 상자 아래 모서리를 잡을 때 쓴다. */
	const flip = (y: number, boxHeight = 0) => sceneHeight - y - boxHeight

	switch (primitive.kind) {
		case 'group': {
			// 그룹은 인쇄물에서 의미가 없다 — 자식만 순서대로 그린다(레이어 구조는 SVG가 갖는다).
			for (const child of primitive.children) await draw(pdf, page, child, sceneHeight)
			return
		}
		case 'path':
			// drawSvgPath는 주어진 점을 좌상단으로 보고 path의 y를 아래로 읽는다.
			page.drawSvgPath(primitive.d, {
				color: primitive.fill ? parseColor(primitive.fill) : undefined,
				...(primitive.stroke ? { borderColor: parseColor(primitive.stroke) } : {}),
				...(primitive.strokeWidth === undefined
					? {}
					: { borderWidth: primitive.strokeWidth }),
				...(primitive.opacity === undefined ? {} : { opacity: primitive.opacity }),
				scale: 1,
				x: primitive.x ?? 0,
				y: flip(primitive.y ?? 0),
			})
			return
		case 'rect': {
			// 모서리가 둥글면 사각형 명령으로는 못 그린다 — path로 내려 보낸다.
			if (primitive.radius) {
				return draw(
					pdf,
					page,
					{
						kind: 'path',
						d: roundedRectPath(primitive.width, primitive.height, primitive.radius),
						x: primitive.x,
						y: primitive.y,
						...(primitive.fill ? { fill: primitive.fill } : {}),
						...(primitive.stroke ? { stroke: primitive.stroke } : {}),
						...(primitive.strokeWidth === undefined
							? {}
							: { strokeWidth: primitive.strokeWidth }),
						...(primitive.opacity === undefined ? {} : { opacity: primitive.opacity }),
					},
					sceneHeight,
				)
			}
			page.drawRectangle({
				color: primitive.fill ? parseColor(primitive.fill) : undefined,
				height: primitive.height,
				width: primitive.width,
				x: primitive.x,
				y: flip(primitive.y, primitive.height),
				...(primitive.stroke ? { borderColor: parseColor(primitive.stroke) } : {}),
				...(primitive.strokeWidth === undefined
					? {}
					: { borderWidth: primitive.strokeWidth }),
				...(primitive.opacity === undefined ? {} : { opacity: primitive.opacity }),
			})
			return
		}
		case 'image': {
			const embedded = await embedImage(pdf, primitive.href)
			if (!embedded) return
			page.drawImage(embedded, {
				height: primitive.height,
				width: primitive.width,
				x: primitive.x,
				y: flip(primitive.y, primitive.height),
				...(primitive.opacity === undefined ? {} : { opacity: primitive.opacity }),
			})
			return
		}
		case 'line':
			page.drawLine({
				color: parseColor(primitive.stroke),
				end: { x: primitive.x2, y: flip(primitive.y2) },
				start: { x: primitive.x1, y: flip(primitive.y1) },
				thickness: primitive.strokeWidth,
			})
			return
		case 'circle':
			page.drawCircle({
				color: parseColor(primitive.fill),
				size: primitive.radius,
				x: primitive.cx,
				y: flip(primitive.cy),
			})
			return
		case 'text':
			// 굽기 단계가 윤곽선으로 바꾸지 못한 글줄이다. 서체를 임베드하지 않는 계약이라 그릴 수 없다 —
			// 호출부가 `notOutlined`를 보고 막거나 래스터로 떨어뜨린다.
			return
	}
}

/** data: URI만 임베드한다 — 외부 URL을 서버에서 받아 오는 순간 SSRF 표면이 된다. */
async function embedImage(pdf: PDFDocument, href: string) {
	const match = href.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/)
	if (!match) return null
	const bytes = Buffer.from(match[2], 'base64')
	return match[1] === 'png' ? pdf.embedPng(bytes) : pdf.embedJpg(bytes)
}

/** 네 모서리가 같은 둥근 사각형. 원점은 좌상단이고 호출부가 x·y로 옮긴다. */
export function roundedRectPath(width: number, height: number, radius: number): string {
	const r = Math.min(radius, width / 2, height / 2)
	return [
		`M${r} 0`,
		`H${width - r}`,
		`A${r} ${r} 0 0 1 ${width} ${r}`,
		`V${height - r}`,
		`A${r} ${r} 0 0 1 ${width - r} ${height}`,
		`H${r}`,
		`A${r} ${r} 0 0 1 0 ${height - r}`,
		`V${r}`,
		`A${r} ${r} 0 0 1 ${r} 0`,
		'Z',
	].join('')
}

/** `#rrggbb`만 읽는다 — 씬은 워커가 이미 정규화해 넣는다. */
function parseColor(value: string) {
	const match = value.match(/^#([0-9a-f]{6})$/i)
	if (!match) return undefined
	const int = Number.parseInt(match[1], 16)
	return rgb(((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255)
}
