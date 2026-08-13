import type { VectorSceneArtifact } from '../export-artifact'

/** 파일 형식과 무관한 최소 Vector Scene을 SVG 문서로 직렬화한다. */
export function vectorSceneToSvg(artifact: VectorSceneArtifact): string {
	const { background, height, primitives, width } = artifact.source
	const body = primitives
		.map((primitive) => {
			if (primitive.kind === 'line') {
				return `  <line x1="${fixed(primitive.x1)}" y1="${fixed(primitive.y1)}" x2="${fixed(primitive.x2)}" y2="${fixed(primitive.y2)}" stroke="${attribute(primitive.stroke)}" stroke-width="${fixed(primitive.strokeWidth)}"${primitive.lineCap ? ` stroke-linecap="${primitive.lineCap}"` : ''} />`
			}
			return `  <circle cx="${fixed(primitive.cx)}" cy="${fixed(primitive.cy)}" r="${fixed(primitive.radius)}" fill="${attribute(primitive.fill)}" />`
		})
		.join('\n')

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${attribute(background)}" />
${body}
</svg>`
}

function fixed(value: number): string {
	return value.toFixed(2)
}

function attribute(value: string): string {
	return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
}
