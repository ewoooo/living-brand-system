import { strFromU8, unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { exportResultsToZip } from './export-results-to-zip.client'

describe('exportResultsToZip', () => {
	it('여러 결과와 UTF-8 파일명을 ZIP 하나로 보존한다', async () => {
		const result = await exportResultsToZip({
			format: 'zip',
			filename: '결과',
			items: [
				{ data: exportBlob('one'), filename: '첫번째.png', mimeType: 'image/png' },
				{ data: exportBlob('two'), filename: 'second.svg', mimeType: 'image/svg+xml' },
			],
		})
		const files = unzipSync(new Uint8Array(await readBlob(result.data)))

		expect(result).toMatchObject({ filename: '결과.zip', mimeType: 'application/zip' })
		expect(strFromU8(files['첫번째.png'] ?? new Uint8Array())).toBe('one')
		expect(strFromU8(files['second.svg'] ?? new Uint8Array())).toBe('two')
	})

	it('경로 또는 중복 파일명을 거부한다', async () => {
		const item = { data: new Blob(), filename: '../unsafe.png', mimeType: 'image/png' }
		await expect(
			exportResultsToZip({ format: 'zip', filename: '결과.zip', items: [item] }),
		).rejects.toThrow('파일명')
	})
})

function exportBlob(value: string): Blob {
	return {
		arrayBuffer: async () => new TextEncoder().encode(value).buffer,
	} as Blob
}

function readBlob(blob: Blob): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.addEventListener('load', () => resolve(reader.result as ArrayBuffer), { once: true })
		reader.addEventListener('error', () => reject(reader.error), { once: true })
		reader.readAsArrayBuffer(blob)
	})
}
