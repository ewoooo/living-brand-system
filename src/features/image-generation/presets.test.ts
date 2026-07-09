import { describe, expect, it } from 'vitest'
import {
	composeScenePrompt,
	ESSENHERB_BASE,
	IMAGE_SCENES,
	pickSceneByKeyword,
	resolveScene,
} from './presets'

describe('resolveScene', () => {
	it('알 수 없는 id / auto / 미지정은 null (상위에서 자동 선택)', () => {
		expect(resolveScene('nope')).toBeNull()
		expect(resolveScene('auto')).toBeNull()
		expect(resolveScene()).toBeNull()
	})

	it('존재하는 id는 해당 Scene', () => {
		expect(resolveScene('asparagus')?.id).toBe('asparagus')
	})
})

describe('pickSceneByKeyword', () => {
	it('입력 키워드가 Scene에 매칭되면 그 Scene', () => {
		expect(pickSceneByKeyword('아스파라거스 사이에 앰플').id).toBe('asparagus')
		expect(pickSceneByKeyword('a bottle on aloe leaves').id).toBe('aloe')
	})

	it('매칭 없으면 첫 Scene으로 폴백', () => {
		expect(pickSceneByKeyword('xyzzy').id).toBe(IMAGE_SCENES[0].id)
	})
})

describe('composeScenePrompt', () => {
	it('base·Scene·subject를 모두 담고 브랜드 배경을 유지한다', () => {
		const scene = resolveScene('red-pumpkin')
		expect(scene).not.toBeNull()
		if (!scene) return
		const prompt = composeScenePrompt(scene, '허브 세럼 앰플')
		expect(prompt).toContain('허브 세럼 앰플')
		expect(prompt).toContain(ESSENHERB_BASE.background)
		expect(prompt).toContain(scene.composition)
		expect(prompt).toContain(scene.moodAccent)
	})
})

describe('IMAGE_SCENES', () => {
	it('모든 Scene은 필수 필드와 지원 size를 가진다', () => {
		for (const scene of IMAGE_SCENES) {
			expect(scene.id).toBeTruthy()
			expect(scene.label).toBeTruthy()
			expect(scene.composition).toBeTruthy()
			expect(scene.colorHarmony.length).toBeGreaterThan(0)
			expect(['1024x1024', '1536x1024', '1024x1536']).toContain(scene.size)
		}
	})

	it('Scene id는 고유하다', () => {
		const ids = IMAGE_SCENES.map((s) => s.id)
		expect(new Set(ids).size).toBe(ids.length)
	})
})
