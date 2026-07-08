import { describe, expect, it } from 'vitest'
import { composeImageRequest, IMAGE_PRESETS } from './presets'

describe('composeImageRequest', () => {
	it('프리셋 없으면 입력을 그대로 쓰고 기본 정사각 size', () => {
		const { prompt, size } = composeImageRequest('herb serum')
		expect(prompt).toBe('herb serum')
		expect(size).toBe('1024x1024')
	})

	it('알 수 없는 presetId는 프리셋 없음으로 처리', () => {
		const { prompt, size } = composeImageRequest('herb serum', 'nope')
		expect(prompt).toBe('herb serum')
		expect(size).toBe('1024x1024')
	})

	it('프리셋을 고르면 {input}에 입력이 합성되고 프리셋 size를 쓴다', () => {
		const { prompt, size } = composeImageRequest('herb serum', 'advertisement')
		const preset = IMAGE_PRESETS.find((p) => p.id === 'advertisement')
		expect(prompt).toBe(preset?.promptTemplate.replace('{input}', 'herb serum'))
		expect(prompt).toContain('herb serum')
		expect(prompt).not.toContain('{input}')
		expect(size).toBe('1536x1024')
	})

	it('모든 프리셋 template에 {input} 자리와 지원 size가 있다', () => {
		for (const preset of IMAGE_PRESETS) {
			expect(preset.promptTemplate).toContain('{input}')
			expect(['1024x1024', '1536x1024', '1024x1536']).toContain(preset.size)
		}
	})
})
