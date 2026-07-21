import { describe, expect, it } from 'vitest'
import {
	mergeImageProfilePrompt,
	validateImageProfilePromptRows,
	validateImagePromptNormalizationRows,
} from './image-profile-prompt'

describe('image profile prompt', () => {
	it('프로파일과 정규화 결과를 flat JSON으로 합치고 같은 키는 정규화 값이 우선한다', () => {
		expect(
			mergeImageProfilePrompt(
				[
					{ key: 'style', value: 'minimalist editorial cosmetic photography' },
					{ key: 'background', value: 'pure solid white' },
				],
				{ background: 'warm gray', mood: 'organic' },
			),
		).toEqual({
			style: 'minimalist editorial cosmetic photography',
			background: 'warm gray',
			mood: 'organic',
		})
	})

	it('테이블 안의 중복 키를 거부한다', () => {
		expect(
			validateImageProfilePromptRows([
				{ key: 'style', value: 'a' },
				{ key: 'style', value: 'b' },
			]),
		).toBe('키는 테이블 안에서 중복될 수 없습니다.')
	})

	it('정규화 값 후보의 중복을 거부한다', () => {
		expect(
			validateImagePromptNormalizationRows([
				{
					key: 'mood',
					candidates: [{ value: 'organic' }, { value: 'organic' }],
				},
			]),
		).toBe('값 후보는 중복될 수 없습니다.')
	})
})
