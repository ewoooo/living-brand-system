import {
	type Color,
	cmyk,
	LineCapStyle,
	PDFDocument,
	PDFName,
	type PDFPage,
	PDFRawStream,
	type PDFRef,
	PDFString,
	popGraphicsState,
	pushGraphicsState,
	rgb,
	setGraphicsState,
} from 'pdf-lib'
import type { VectorPrimitive, VectorScene } from '@/modules/studio-artifact/studio-artifact'
import { type PrintPpi, pixelsToPdfPoints } from '../print-policy'
import type { CmykColor } from './rgb-to-cmyk.sharp'

/**
 * Vector Scene을 단일 페이지 벡터 PDF로 직렬화한다. 인쇄용 내보내기의 최종 어댑터다.
 *
 * 🔑 글자는 여기 오기 전에 이미 윤곽선 path다(`outline-vector-scene`). 그래서 **서체를 임베드하지
 *    않는다** — 인쇄소가 서체를 갖고 있지 않아도 되고 라이선스도 따라오지 않는다.
 * 🔴 씬은 y가 아래로, PDF는 y가 위로 자란다. 페이지 전체를 뒤집으면 이미지와 path가 **두 번**
 *    뒤집히므로(pdf-lib의 `drawSvgPath`가 이미 y를 아래로 읽는다) 프리미티브마다 명시적으로 옮긴다.
 * 🔴 pdf-lib은 그라디언트·그림자·블러를 그리지 못한다. 그런 노드는 씬에 오기 전에 래스터로 바뀌어
 *    `image`로 들어와야 한다(워커의 `unsupported`가 그 목록이다).
 * 🔑 `cmyk`를 주면 도형 색을 잉크로 찍고 PDF/X OutputIntent를 붙인다 — 래스터 인쇄 경로와 같은
 *    ICC를 타야 같은 판의 이미지와 도형이 같은 색으로 나온다.
 * 🔴 씬 좌표는 CSS px이고 PDF 단위는 pt(1/72인치)다. 둘을 그대로 맞대면 **판이 72ppi라고 선언하는
 *    것**이 되어 A4 판이 381mm 페이지로 나간다. 그래서 다 그린 뒤 판 전체를 `ppi`로 되읽는다.
 */
export async function vectorSceneToPdf(
	scene: VectorScene,
	print?: {
		/** 씬의 px 좌표를 물리 크기로 읽는 해상도. 페이지 치수와 내용 배율을 함께 정한다. */
		ppi: PrintPpi
		/**
		 * 주면 도형 색을 잉크로 찍고 OutputIntent를 붙인다. **안 주면 RGB로 나간다.**
		 * 🔴 지금 호출부는 주지 않는다 — PDF 안의 CMYK 이미지가 Illustrator에서 반전돼 열리는
		 *    알려진 결함 때문에 인쇄 PDF를 RGB로 내고 있다(`png-to-pdf.pdf-lib`에 근거).
		 */
		cmyk?: {
			colors: ReadonlyMap<string, CmykColor>
			iccProfile: Buffer
			iccProfileName: string
		}
	},
): Promise<Buffer> {
	const pdf = await PDFDocument.create()
	const page = pdf.addPage([scene.width, scene.height])
	const profileRef = print?.cmyk
		? attachOutputIntent(pdf, print.cmyk.iccProfile, print.cmyk.iccProfileName)
		: null
	const color = (value: string | undefined) => resolveColor(value, print?.cmyk?.colors)

	page.drawRectangle({
		color: color(scene.background) ?? rgb(1, 1, 1),
		height: scene.height,
		width: scene.width,
		x: 0,
		y: 0,
	})
	for (const primitive of scene.primitives)
		await draw(pdf, page, primitive, scene.height, color, profileRef)

	// 🔴 반드시 다 그린 뒤에 부른다 — `scale`은 이미 쌓인 content stream을 감싸는 방식이라
	//    먼저 부르면 그 뒤에 그린 것이 배율 밖에 남는다.
	const pointsPerPixel = print ? pixelsToPdfPoints(1, print.ppi) : 1
	if (pointsPerPixel !== 1) page.scale(pointsPerPixel, pointsPerPixel)

	return Buffer.from(await pdf.save())
}

/** 씬에서 잉크로 바꿔야 하는 색을 모은다 — 호출부가 이 목록만 ICC 변환하면 된다. */
export function collectSceneColors(scene: VectorScene): string[] {
	const collect = (primitives: readonly VectorPrimitive[]): string[] =>
		primitives.flatMap((primitive) => {
			if (primitive.kind === 'group') return collect(primitive.children)
			return [
				'fill' in primitive ? primitive.fill : undefined,
				'stroke' in primitive ? primitive.stroke : undefined,
			].filter((value): value is string => typeof value === 'string')
		})
	return [scene.background, ...collect(scene.primitives)]
}

/** PDF/X가 요구하는 출력 의도. `cmyk-jpeg-to-pdf`와 같은 형태다. 이미지 색 공간도 이 프로파일을 쓴다. */
function attachOutputIntent(pdf: PDFDocument, iccProfile: Buffer, iccProfileName: string): PDFRef {
	const profile = pdf.context.flateStream(Uint8Array.from(iccProfile), {
		Alternate: 'DeviceCMYK',
		N: 4,
	})
	const profileRef = pdf.context.register(profile)
	const outputIntent = pdf.context.obj({
		Type: 'OutputIntent',
		S: 'GTS_PDFX',
		DestOutputProfile: profileRef,
		Info: PDFString.of(iccProfileName),
		OutputConditionIdentifier: PDFString.of(iccProfileName),
		RegistryName: PDFString.of('https://registry.color.org'),
	})
	pdf.catalog.set(
		PDFName.of('OutputIntents'),
		pdf.context.obj([pdf.context.register(outputIntent)]),
	)
	return profileRef
}

type ColorResolver = (value: string | undefined) => Color | undefined

function resolveColor(
	value: string | undefined,
	colors: ReadonlyMap<string, CmykColor> | undefined,
) {
	if (!value) return undefined
	const ink = colors?.get(value.toLowerCase())
	if (ink) return cmyk(ink.c, ink.m, ink.y, ink.k)
	return parseColor(value)
}

/** 씬 계약의 lineCap 어휘를 pdf-lib enum으로 옮긴다. SVG 직렬화기는 문자열을 그대로 쓴다. */
const PDF_LINE_CAP = {
	butt: LineCapStyle.Butt,
	round: LineCapStyle.Round,
	square: LineCapStyle.Projecting,
} as const satisfies Record<string, LineCapStyle>

async function draw(
	pdf: PDFDocument,
	page: PDFPage,
	primitive: VectorPrimitive,
	sceneHeight: number,
	color: ColorResolver,
	profileRef: PDFRef | null,
): Promise<void> {
	/** 씬 좌표(위에서 아래)를 PDF 좌표(아래에서 위)로. `boxHeight`는 상자 아래 모서리를 잡을 때 쓴다. */
	const flip = (y: number, boxHeight = 0) => sceneHeight - y - boxHeight

	switch (primitive.kind) {
		case 'group': {
			// 레이어 구조는 SVG가 갖는다(PDF에는 OCG를 만들지 않는다). 다만 **불투명도는 옮겨야 한다** —
			// 흘리면 40% 딤 레이어가 100%로 인쇄된다.
			// 🔴 이것은 **진짜 그룹 투명도가 아니다.** ExtGState `ca`는 그룹이 아니라 그 안에서 그리는
			//    **개별 요소**에 걸리므로, 자식이 자기 opacity를 가지면 둘이 곱해지고 겹친 자식끼리는
			//    서로 비쳐 보인다. SVG의 `<g opacity>`와 결과가 갈리는 지점이다.
			// 🔑 그래도 넣는 이유: 전에는 흘려서 40% 딤이 100%로 인쇄됐다 — 자식에 opacity가 없는
			//    흔한 경우는 이걸로 맞는다. 진짜 그룹 투명도는 Transparency Group XObject가 필요하고
			//    pdf-lib에 고수준 API가 없다.
			const opacity = primitive.opacity
			const grouped = opacity !== undefined && opacity < 1
			if (grouped) {
				const state = pdf.context.obj({ Type: 'ExtGState', ca: opacity, CA: opacity })
				page.pushOperators(
					pushGraphicsState(),
					setGraphicsState(page.node.newExtGState('GS', state)),
				)
			}
			for (const child of primitive.children)
				await draw(pdf, page, child, sceneHeight, color, profileRef)
			if (grouped) page.pushOperators(popGraphicsState())
			return
		}
		case 'path':
			// drawSvgPath는 주어진 점을 좌상단으로 보고 path의 y를 아래로 읽는다.
			// ponytail: fillRule을 흘린다 — pdf-lib 1.17.1의 drawSvgPath는 `f`(nonzero)만 내보내고
			// `f*`를 쓸 고수준 API가 없다. 리포 자산 8개 중 evenodd는 0건이라 지금은 잠재 결함이고,
			// 업로드 자산에서 구멍이 메워지면 operator 목록을 직접 만들어 `f*`로 바꾼다(SVG는 이미 맞다).
			page.drawSvgPath(primitive.d, {
				color: color(primitive.fill),
				...(primitive.stroke ? { borderColor: color(primitive.stroke) } : {}),
				...(primitive.strokeWidth === undefined
					? {}
					: { borderWidth: primitive.strokeWidth }),
				...(primitive.opacity === undefined ? {} : { opacity: primitive.opacity }),
				// 🔴 배율을 빠뜨리면 SVG는 멀쩡한데 PDF에서만 로고가 viewBox 크기로 찍힌다.
				scale: primitive.scale ?? 1,
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
					color,
					profileRef,
				)
			}
			page.drawRectangle({
				color: color(primitive.fill),
				height: primitive.height,
				width: primitive.width,
				x: primitive.x,
				y: flip(primitive.y, primitive.height),
				...(primitive.stroke ? { borderColor: color(primitive.stroke) } : {}),
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
			// 🔴 pdf-lib은 3채널 이미지를 DeviceRGB로 넣는다. 서비스가 CMYK로 바꿔 둔 것은
			//    색 공간을 출력 의도와 같은 ICC로 덮어야 RIP가 다시 변환하지 않는다.
			if (primitive.colorSpace === 'cmyk' && profileRef) {
				await embedded.embed()
				const stream = pdf.context.lookup(embedded.ref)
				if (stream instanceof PDFRawStream) {
					stream.dict.set(
						PDFName.of('ColorSpace'),
						pdf.context.obj([PDFName.of('ICCBased'), profileRef]),
					)
					// 🔴 pdf-lib이 심는 `Decode [1 0 1 0 1 0 1 0]`을 **지우지 않는다.** APP14 Adobe
					//    마커가 붙은 CMYK JPEG은 샘플을 반전해서 저장하는데, PDF 리더는 APP14를
					//    보지 않으므로 되뒤집는 일을 이 배열이 해야 한다. 지우면 반전된 샘플이 그대로
					//    잉크로 읽혀 초록이 검정으로, 파랑이 노랑으로 열린다(2026-09-09 실측).
					//    🔑 JPEG 자체는 정상이다 — libjpeg·ColorSync는 마커를 보고 초록으로 읽는다.
					//    그래서 파일만 열어 보면 결함이 안 보이고 PDF 안에서만 드러난다.
				}
			}
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
				color: color(primitive.stroke),
				end: { x: primitive.x2, y: flip(primitive.y2) },
				start: { x: primitive.x1, y: flip(primitive.y1) },
				thickness: primitive.strokeWidth,
				// 🔴 흘리면 PDF 기본값 butt가 되어 대시가 굵기만큼 짧아지고 간격이 벌어진다 —
				//    그리드형 그래픽 런타임들이 `square`로 대시를 그리므로 패턴 밀도가 눈에 보이게 달라진다.
				...(primitive.lineCap === undefined
					? {}
					: { lineCap: PDF_LINE_CAP[primitive.lineCap] }),
			})
			return
		case 'circle':
			page.drawCircle({
				color: color(primitive.fill),
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

/**
 * 씬은 `#rrggbb`를 약속하지만 `#rgb`·`rgb(...)`도 읽는다.
 * 🔴 못 읽는 색을 undefined로 흘리면 그 도형이 **색 없이 사라진다** — 인쇄물에서는 눈치채기 어렵다.
 */
export function parseColor(value: string) {
	const short = value.match(/^#([0-9a-f]{3})$/i)
	const hex = short
		? short[1]
				.split('')
				.map((channel) => channel + channel)
				.join('')
		: value.match(/^#([0-9a-f]{6})$/i)?.[1]
	if (hex) {
		const int = Number.parseInt(hex, 16)
		return rgb(((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255)
	}
	const parts = value
		.match(/^rgba?\(([^)]+)\)$/i)?.[1]
		?.split(/[,/\s]+/)
		.filter(Boolean)
		.map(Number)
	if (parts && parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
		return rgb(parts[0] / 255, parts[1] / 255, parts[2] / 255)
	}
	return undefined
}
