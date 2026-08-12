// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { canvasFramesToMp4 } from './canvas-frames-to-mp4.mediabunny.client'

const media = vi.hoisted(() => ({
	add: vi.fn(),
	codec: vi.fn(),
}))

vi.mock('mediabunny', () => ({
	BufferTarget: class {
		buffer: ArrayBuffer | null = new ArrayBuffer(4)
	},
	CanvasSource: class {
		add = media.add
	},
	getFirstEncodableVideoCodec: media.codec,
	Mp4OutputFormat: class {
		getSupportedVideoCodecs() {
			return ['avc']
		}
	},
	Output: class {
		state = 'pending'
		constructor(public options: { target: unknown }) {}
		addVideoTrack() {}
		async start() {
			this.state = 'started'
		}
		async finalize() {
			this.state = 'finalized'
		}
		async cancel() {
			this.state = 'canceled'
		}
	},
}))

describe('canvasFramesToMp4', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		media.codec.mockResolvedValue('avc')
		media.add.mockResolvedValue(undefined)
	})

	it('고정 fps timestamp로 매 프레임을 그려 AVC MP4를 만든다', async () => {
		const renderFrame = vi.fn()
		const result = await canvasFramesToMp4({
			canvas: document.createElement('canvas'),
			renderFrame,
			spec: {
				container: 'mp4',
				codec: 'h264',
				durationSeconds: 0.1,
				fps: 24,
				width: 640,
				height: 360,
				colorSpace: 'rec709',
			},
		})

		expect(result.type).toBe('video/mp4')
		expect(renderFrame.mock.calls.map(([time]) => time)).toEqual([0, 1 / 24, 2 / 24])
		expect(media.add).toHaveBeenCalledTimes(3)
	})

	it('AVC 인코더가 없으면 사용자 조치 메시지로 중단한다', async () => {
		media.codec.mockResolvedValue(null)
		await expect(
			canvasFramesToMp4({
				canvas: document.createElement('canvas'),
				renderFrame: vi.fn(),
				spec: {
					container: 'mp4',
					codec: 'h264',
					durationSeconds: 1,
					fps: 30,
					width: 640,
					height: 360,
					colorSpace: 'rec709',
				},
			}),
		).rejects.toThrow('H.264 MP4 인코딩을 지원하지 않습니다')
	})
})
