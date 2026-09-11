import {
	type Color,
	cmyk,
	concatTransformationMatrix,
	drawObject,
	LineCapStyle,
	PDFDocument,
	PDFName,
	type PDFPage,
	type PDFRef,
	PDFString,
	popGraphicsState,
	pushGraphicsState,
	rgb,
	setGraphicsState,
} from 'pdf-lib'
import type { VectorPrimitive, VectorScene } from '@/modules/studio-artifact/studio-artifact'
import { type PrintPpi, pixelsToPdfPoints } from '../print-policy'
import type { CmykSamples } from './image-to-cmyk-samples.sharp'
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
		 * 🔑 인쇄 경로(`exportVectorPrint`)는 프로파일이 있으면 항상 준다 — 「한 파일 한 색상 모드」라
		 *    RGB가 한 칸도 남으면 Illustrator가 문서 모드를 골라 정본 CMYK 수치를 깨뜨린다.
		 *    프로파일이 없는 화면용 호출만 안 준다.
		 */
		cmyk?: {
			colors: ReadonlyMap<string, CmykColor>
			/**
			 * href → CMYK 잉크 샘플. 주면 그 이미지를 raw + FlateDecode로 싣는다.
			 * 🔴 없는 이미지는 RGB로 나가 파일이 혼재가 된다 — 호출부가 전수로 채워야 한다.
			 */
			images: ReadonlyMap<string, CmykSamples>
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
	const samples = print?.cmyk?.images

	// 🔴 씬이 바닥색을 선언했을 때만 칠한다 — 없을 때 흰색을 발명하면 루트 프레임의 rect와 겹쳐
	//    판 전체 사각형이 두 장이 된다. 칠하지 않은 자리는 인쇄에서 종이다.
	const plate = scene.background ? color(scene.background) : null
	if (plate) {
		page.drawRectangle({ color: plate, height: scene.height, width: scene.width, x: 0, y: 0 })
	}
	for (const primitive of scene.primitives)
		await draw(pdf, page, primitive, scene.height, color, profileRef, samples)

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
	return [...(scene.background ? [scene.background] : []), ...collect(scene.primitives)]
}

/**
 * 씬에 실린 이미지의 href를 모은다 — 호출부가 이 목록만 잉크 샘플로 바꾸면 된다.
 * 🔴 하나라도 빠뜨리면 그 이미지가 RGB로 나가 파일이 혼재가 되고, Illustrator가 문서 모드를
 *    하나 골라 나머지를 변환하면서 도형의 정본 CMYK 수치까지 깨뜨린다.
 */
export function collectSceneImages(scene: VectorScene): string[] {
	const collect = (primitives: readonly VectorPrimitive[]): string[] =>
		primitives.flatMap((primitive) => {
			if (primitive.kind === 'group') return collect(primitive.children)
			return primitive.kind === 'image' ? [primitive.href] : []
		})
	return collect(scene.primitives)
}

/** 출력 의도. 이미지 색 공간(`drawCmykSamples`의 `ICCBased`)도 같은 프로파일 스트림을 재사용한다. */
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
	samples: ReadonlyMap<string, CmykSamples> | undefined,
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
				await draw(pdf, page, child, sceneHeight, color, profileRef, samples)
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
					samples,
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
			const ink = samples?.get(primitive.href)
			if (ink) {
				drawCmykSamples(pdf, page, {
					height: primitive.height,
					ink,
					opacity: primitive.opacity,
					profileRef,
					width: primitive.width,
					x: primitive.x,
					y: flip(primitive.y, primitive.height),
				})
				return
			}
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

/**
 * CMYK 잉크 샘플을 raw + FlateDecode 이미지 XObject로 싣는다.
 *
 * 🔴 **`Decode`를 넣지 않는다.** 넣을 이유가 없기 때문이다 — 샘플이 잉크값 그대로이고(0 = 잉크
 *    없음) APP14 Adobe 마커도 없으므로 기본값 `[0 1]×4`가 맞다. JPEG 경로에서 그 배열을
 *    「넣었다 뺐다」 하던 다툼이 여기서는 성립하지 않는다.
 * 🔑 알파는 같은 크기의 8bit DeviceGray 스트림을 `/SMask`로 문다 — pdf-lib의 PngEmbedder가
 *    쓰는 것과 같은 형태다. CMYK JPEG이 구조적으로 못 담던 것이 이 경로에서는 그냥 된다.
 * 🔴 `Filter`·`Length`는 손대지 않는다. `flateStream`이 Filter를 강제로 덮고 Length는 직렬화
 *    시점에 압축 후 크기로 덮인다 — 우리가 넣은 값은 조용히 버려진다.
 */
function drawCmykSamples(
	pdf: PDFDocument,
	page: PDFPage,
	{
		height,
		ink,
		opacity,
		profileRef,
		width,
		x,
		y,
	}: {
		height: number
		ink: CmykSamples
		opacity: number | undefined
		profileRef: PDFRef | null
		width: number
		x: number
		y: number
	},
) {
	const box = { Height: ink.height, Width: ink.width }
	const alphaRef = ink.alpha
		? pdf.context.register(
				pdf.context.flateStream(Uint8Array.from(ink.alpha), {
					...box,
					BitsPerComponent: 8,
					ColorSpace: 'DeviceGray',
					Decode: [0, 1],
					Subtype: 'Image',
					Type: 'XObject',
				}),
			)
		: undefined
	const imageRef = pdf.context.register(
		pdf.context.flateStream(Uint8Array.from(ink.cmyk), {
			...box,
			BitsPerComponent: 8,
			// 출력 의도와 같은 프로파일을 문다 — 뷰어·RIP가 잉크 공간을 추측하지 않는다.
			ColorSpace: profileRef ? [PDFName.of('ICCBased'), profileRef] : 'DeviceCMYK',
			// 🔑 값이 undefined면 `obj()`가 키 자체를 넣지 않는다 — 알파 없는 이미지에 SMask가 안 붙는다.
			SMask: alphaRef,
			Subtype: 'Image',
			Type: 'XObject',
		}),
	)

	// 🔴 `newXObject`가 돌려주는 이름을 변수로 받아 그대로 넘긴다. `drawObject`는 등록되지 않은
	//    이름을 예외 없이 통과시켜 **빈 자리**로 내보내므로, 문자열을 다시 타이핑하면 조용히 사라진다.
	const key = page.node.newXObject('CmykImage', imageRef)
	const dimmed = opacity !== undefined && opacity < 1
	page.pushOperators(
		pushGraphicsState(),
		...(dimmed
			? [
					setGraphicsState(
						page.node.newExtGState(
							'GS',
							pdf.context.obj({ Type: 'ExtGState', ca: opacity, CA: opacity }),
						),
					),
				]
			: []),
		// 이미지 XObject는 단위 정사각형에 그려진다 — 이 행렬이 실제 크기와 위치를 만든다.
		concatTransformationMatrix(width, 0, 0, height, x, y),
		drawObject(key),
		popGraphicsState(),
	)
}

/** data: URI만 임베드한다 — 외부 URL을 서버에서 받아 오는 순간 SSRF 표면이 된다. */
async function embedImage(pdf: PDFDocument, href: string) {
	const match = href.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/)
	if (!match) return null
	// 🔴 오프셋 없는 사본으로 넘긴다. pdf-lib의 `JpegEmbedder`가 `imageData.buffer`를 읽으면서
	//    `byteOffset`을 무시하기 때문이다 — Node의 Buffer 풀(4KB 이하)에서 잘라 온 버퍼는 오프셋이
	//    0이 아니어서 `SOI not found in JPEG`으로 **내보내기가 통째로 죽는다**(실측: 317B JPEG →
	//    byteOffset 6000). 작은 아이콘 사진 한 장으로 판 전체가 안 나가던 결함이다.
	//    PNG는 영향이 없지만 같은 형태로 넘겨 둔다 — 어느 쪽이 안전한지 부르는 쪽이 기억할 필요가 없다.
	const bytes = Uint8Array.from(Buffer.from(match[2], 'base64'))
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
