import type { ForwardStraightScene } from './forward-straight-geometry'

export function createForwardStraightSvg(scene: ForwardStraightScene): string {
	const lines = scene.dashes
		.map(
			(dash) =>
				`  <line x1="${fixed(dash.x1)}" y1="${fixed(dash.y1)}" x2="${fixed(dash.x2)}" y2="${fixed(dash.y2)}" stroke="${scene.lineColor}" stroke-width="${fixed(dash.weight)}" stroke-linecap="square" />`,
		)
		.join('\n')

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}">
  <rect width="${scene.width}" height="${scene.height}" fill="${scene.backgroundColor}" />
${lines}
  <circle cx="${fixed(scene.origin.x)}" cy="${fixed(scene.origin.y)}" r="${fixed(scene.originRadius)}" fill="${scene.originColor}" />
</svg>`
}

function fixed(value: number): string {
	return value.toFixed(2)
}
