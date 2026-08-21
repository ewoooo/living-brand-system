import { describe, expect, it } from 'vitest'
import type { TemplateBackgroundState } from '../contexts/template-studio-context'
import { updateTemplateBackground } from './template-studio-provider'

const STATE: TemplateBackgroundState = {
	type: 'color',
	imageMode: 'preset',
	color: null,
	prompt: '',
	generating: false,
	error: null,
	featureValues: {},
	graphicValues: {},
	dimmer: false,
	dimmerOpacity: 0.2,
}

describe('updateTemplateBackground', () => {
	// 실사고(2026-08-20): 리듀서가 dimmer 패치를 버려 스테이지에서 On이 눌리지 않았다.
	// TemplateBackgroundPatch의 키 전부가 상태에 반영되는지를 지킨다.
	it('patch의 모든 키를 상태에 반영한다', () => {
		const patched = updateTemplateBackground(
			STATE,
			{ imageMode: 'generate', dimmer: true, dimmerOpacity: 0.5 },
			[],
		)
		expect(patched).toMatchObject({ imageMode: 'generate', dimmer: true, dimmerOpacity: 0.5 })
	})

	it('패치에 없는 키는 그대로 둔다 — 디머를 꺼도 맞춰 둔 강도가 남는다', () => {
		const on = updateTemplateBackground(STATE, { dimmer: true, dimmerOpacity: 0.55 }, [])
		const off = updateTemplateBackground(on, { dimmer: false }, [])
		expect(off.dimmer).toBe(false)
		expect(off.dimmerOpacity).toBe(0.55)
	})
})
