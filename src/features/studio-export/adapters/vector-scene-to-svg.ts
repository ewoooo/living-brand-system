import type {
	VectorPrimitive,
	VectorSceneArtifact,
} from '@/modules/studio-artifact/studio-artifact'

/**
 * 파일 형식과 무관한 Vector Scene을 SVG 문서로 직렬화한다.
 *
 * 🔴 CSS 클래스도 `<style>`도 쓰지 않고 presentation attribute만 쓴다 — Figma·Illustrator가
 *    개체로 풀어 읽는 것이 그쪽이다. 같은 이유로 `foreignObject`는 만들지 않는다.
 * 🔑 글자는 `<text>`로 남긴다. 받는 쪽에서 문구를 고칠 수 있어야 하고, 서체는 디자인 툴이
 *    로컬 설치본으로 잇는다(아웃라인이 필요하면 별도 옵션이지 기본이 아니다).
 */
export function vectorSceneToSvg(artifact: VectorSceneArtifact): string {
	const { background, height, primitives, width } = artifact.source
	const body = primitives
		.map((primitive, index) => serialize(primitive, '  ', `${index}`))
		.join('\n')

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${attribute(background)}" />
${body}
</svg>`
}

/** `path`는 트리에서의 자리(`0-2-1`)다. 클립 id를 여기서 뽑아 같은 장면이 항상 같은 문서가 되게 한다. */
function serialize(primitive: VectorPrimitive, indent: string, path: string): string {
	switch (primitive.kind) {
		case 'line':
			return `${indent}<line x1="${fixed(primitive.x1)}" y1="${fixed(primitive.y1)}" x2="${fixed(primitive.x2)}" y2="${fixed(primitive.y2)}" stroke="${attribute(primitive.stroke)}" stroke-width="${fixed(primitive.strokeWidth)}"${primitive.lineCap ? ` stroke-linecap="${primitive.lineCap}"` : ''} />`
		case 'circle':
			return `${indent}<circle cx="${fixed(primitive.cx)}" cy="${fixed(primitive.cy)}" r="${fixed(primitive.radius)}" fill="${attribute(primitive.fill)}" />`
		case 'rect':
			return `${indent}<rect x="${fixed(primitive.x)}" y="${fixed(primitive.y)}" width="${fixed(primitive.width)}" height="${fixed(primitive.height)}"${optional('rx', primitive.radius)}${optionalText('fill', primitive.fill)}${optionalText('stroke', primitive.stroke)}${optional('stroke-width', primitive.strokeWidth)}${optional('opacity', primitive.opacity)} />`
		case 'text':
			return `${indent}<text x="${fixed(primitive.x)}" y="${fixed(primitive.y)}" font-family="${attribute(primitive.fontFamily)}" font-size="${fixed(primitive.fontSize)}"${optionalInt('font-weight', primitive.fontWeight)}${optional('letter-spacing', primitive.letterSpacing)} fill="${attribute(primitive.fill)}"${optionalText('text-anchor', primitive.textAnchor)}${optional('opacity', primitive.opacity)}>${text(primitive.text)}</text>`
		case 'image':
			return `${indent}<image x="${fixed(primitive.x)}" y="${fixed(primitive.y)}" width="${fixed(primitive.width)}" height="${fixed(primitive.height)}" href="${attribute(primitive.href)}" preserveAspectRatio="${attribute(primitive.preserveAspectRatio ?? 'none')}"${optional('opacity', primitive.opacity)} />`
		case 'path':
			return `${indent}<path d="${attribute(primitive.d)}"${optionalText('fill', primitive.fill)}${optionalText('stroke', primitive.stroke)}${optional('stroke-width', primitive.strokeWidth)}${optionalText('fill-rule', primitive.fillRule)}${optional('opacity', primitive.opacity)} />`
		case 'group':
			return serializeGroup(primitive, indent, path)
	}
}

function serializeGroup(
	group: Extract<VectorPrimitive, { kind: 'group' }>,
	indent: string,
	path: string,
): string {
	const children = group.children
		.map((child, index) => serialize(child, `${indent}  `, `${path}-${index}`))
		.filter(Boolean)
		.join('\n')
	const clip = group.clip
	const clipId = clip ? `clip-${path}` : null
	const defs = clip
		? `${indent}  <defs><clipPath id="${clipId}"><rect x="${fixed(clip.x)}" y="${fixed(clip.y)}" width="${fixed(clip.width)}" height="${fixed(clip.height)}" /></clipPath></defs>\n`
		: ''
	const open = `${indent}<g${optionalText('data-name', group.label)}${optionalText('transform', group.transform)}${optional('opacity', group.opacity)}${clipId ? ` clip-path="url(#${clipId})"` : ''}>`
	return `${open}\n${defs}${children}${children ? '\n' : ''}${indent}</g>`
}

/** font-weight처럼 정수여야 하는 속성 — `700.00`은 일부 뷰어가 무시한다. */
function optionalInt(name: string, value: number | undefined): string {
	return value === undefined ? '' : ` ${name}="${Math.round(value)}"`
}

function optional(name: string, value: number | undefined): string {
	return value === undefined ? '' : ` ${name}="${fixed(value)}"`
}

function optionalText(name: string, value: string | undefined): string {
	return value === undefined ? '' : ` ${name}="${attribute(value)}"`
}

function fixed(value: number): string {
	return value.toFixed(2)
}

function attribute(value: string): string {
	return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}

function text(value: string): string {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}
