'use client'

import {
	BufferTarget,
	CanvasSource,
	getFirstEncodableVideoCodec,
	Mp4OutputFormat,
	Output,
	QUALITY_VERY_HIGH,
} from 'mediabunny'
import type { VideoExportSpec } from '../export-contract'

// 코덱 미지원과 '이 해상도로는 미지원'이 같은 결과로 돌아온다 — 배율을 낮추는 길도 함께 안내한다.
const AVC_UNSUPPORTED_MESSAGE =
	'이 해상도로는 H.264 MP4 인코딩을 지원하지 않습니다. 배율을 낮추거나 최신 Chrome 또는 Safari에서 다시 시도해 주세요.'

/** 결정론적으로 그린 canvas frame을 WebCodecs AVC 기반 MP4 Blob으로 인코딩한다. */
export async function canvasFramesToMp4({
	canvas,
	renderFrame,
	spec,
}: {
	canvas: HTMLCanvasElement
	renderFrame: (timeSeconds: number) => void
	spec: VideoExportSpec
}): Promise<Blob> {
	const format = new Mp4OutputFormat()
	const codec = await getFirstEncodableVideoCodec(
		format.getSupportedVideoCodecs().filter((candidate) => candidate === 'avc'),
		{ width: spec.width, height: spec.height },
	)
	if (codec !== 'avc') throw new Error(AVC_UNSUPPORTED_MESSAGE)

	const target = new BufferTarget()
	const output = new Output({ format, target })
	// ponytail: CanvasSource는 브라우저 canvas의 RGB 색 신호를 따른다. 납품 규격이 정확한
	// Rec.709 transfer metadata까지 요구하면 VideoSampleSource와 픽셀 버퍼 입력으로 교체한다.
	//
	// mediabunny는 해상도에서 비트레이트를 계산한다(3Mbps × (픽셀/1080p)^0.95 × 품질계수).
	// 스튜디오 캔버스는 1080p보다 작아 계수가 그만큼 깎이므로 최상 품질로 되받는다 — 2.04 → 3.86.
	const source = new CanvasSource(canvas, { codec, quality: QUALITY_VERY_HIGH })
	const frameCount = Math.ceil(spec.durationSeconds * spec.fps)
	const frameDuration = 1 / spec.fps
	output.addVideoTrack(source, { frameRate: spec.fps, maximumPacketCount: frameCount })

	try {
		await output.start()
		for (let frame = 0; frame < frameCount; frame += 1) {
			const timestamp = frame * frameDuration
			renderFrame(timestamp)
			await source.add(timestamp, frameDuration)
		}
		await output.finalize()
		if (!target.buffer) throw new Error('MP4 파일을 완성하지 못했습니다.')
		return new Blob([target.buffer], { type: 'video/mp4' })
	} catch (error) {
		if (output.state !== 'finalized' && output.state !== 'canceled') await output.cancel()
		throw error
	}
}
