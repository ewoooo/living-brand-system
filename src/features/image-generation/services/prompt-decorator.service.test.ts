import { describe, expect, it } from 'vitest'
import { buildImagePrompt } from './prompt-decorator.service'

describe('buildImagePrompt (free 모드)', () => {
	it('sceneId="free"는 입력을 그대로 쓰고 정사각 size, 모델 호출 없음', async () => {
		const result = await buildImagePrompt({
			userInput: '  봄 느낌의 추상 배경  ',
			sceneId: 'free',
		})
		expect(result).toEqual({
			prompt: '봄 느낌의 추상 배경',
			size: '1024x1024',
			sceneId: 'free',
		})
	})
})
