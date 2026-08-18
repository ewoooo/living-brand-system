import { describe, expect, it } from 'vitest'
import type { StudioOutputCapability } from '../studio-output'
import { createRasterExportRequest } from './create-raster-export-request'

const capability: StudioOutputCapability = {
	formats: ['mp4'],
	video: {
		mp4: {
			codec: 'h264',
			colorSpace: 'rec709',
			fps: [30],
			maxWidth: 4096,
			maxHeight: 4096,
			maxDurationSeconds: 10,
		},
	},
}

describe('createRasterExportRequest mp4', () => {
	it('H.264가 인코딩할 수 있도록 홀수 변을 1px 내린다', () => {
		const request = createRasterExportRequest('mp4', capability, { width: 630, height: 891 })

		expect(request?.options).toMatchObject({ width: 630, height: 890 })
	})

	it('이미 짝수인 해상도는 그대로 둔다', () => {
		const request = createRasterExportRequest('mp4', capability, { width: 1080, height: 1080 })

		expect(request?.options).toMatchObject({ width: 1080, height: 1080 })
	})
})
