'use client'

import p5 from 'p5'
import type { ForwardStraightInput } from './forward-straight'
import { createForwardStraightScene } from './forward-straight-geometry'

export type ForwardStraightPreview = {
	update(input: ForwardStraightInput): void
	resize(width: number, height: number): void
	getViewport(): { width: number; height: number }
	destroy(): void
}

/**
 * Forward Straight의 브라우저 미리보기만 소유한다.
 * 좌표 계산은 geometry가, Controller 상태는 호출자가 소유한다.
 */
export function createForwardStraightPreview({
	container,
	input,
	onInputChange,
}: {
	container: HTMLElement
	input: ForwardStraightInput
	onInputChange?: (input: ForwardStraightInput) => void
}): ForwardStraightPreview {
	let currentInput = input
	const initialSize = getCanvasSize(container.clientWidth, container.clientHeight)
	const instance = new p5((preview) => {
		preview.setup = () => {
			preview.createCanvas(initialSize.width, initialSize.height)
			preview.pixelDensity(2)
			preview.strokeCap(preview.SQUARE)
			preview.noLoop()
		}

		preview.draw = () => {
			const scene = createForwardStraightScene(currentInput, {
				width: preview.width,
				height: preview.height,
			})

			preview.background(scene.backgroundColor)
			preview.stroke(scene.lineColor)
			preview.noFill()
			for (const dash of scene.dashes) {
				preview.strokeWeight(dash.weight)
				preview.line(dash.x1, dash.y1, dash.x2, dash.y2)
			}
			preview.noStroke()
			preview.fill(scene.originColor)
			preview.circle(scene.origin.x, scene.origin.y, scene.originRadius * 2)
		}

		preview.mouseMoved = () => {
			if (
				preview.mouseX < 0 ||
				preview.mouseX > preview.width ||
				preview.mouseY < 0 ||
				preview.mouseY > preview.height
			) {
				return
			}
			currentInput = {
				...currentInput,
				origin: {
					x: preview.mouseX / preview.width,
					y: preview.mouseY / preview.height,
				},
			}
			onInputChange?.(currentInput)
			preview.redraw()
		}
	}, container)

	return {
		update(nextInput) {
			currentInput = nextInput
			instance.redraw()
		},
		resize(width, height) {
			const size = getCanvasSize(width, height)
			instance.resizeCanvas(size.width, size.height)
			instance.redraw()
		},
		getViewport() {
			return { width: instance.width, height: instance.height }
		},
		destroy() {
			instance.remove()
		},
	}
}

function getCanvasSize(width: number, height: number) {
	return {
		width: Math.max(1, Math.floor(width)),
		height: Math.max(1, Math.floor(height)),
	}
}
