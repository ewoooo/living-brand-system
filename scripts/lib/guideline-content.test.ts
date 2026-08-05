import { describe, expect, it } from 'vitest'
import { collectFileRefs, toPortable } from './guideline-content'

// 정본 변환의 이식 키만 검증한다(DB가 필요한 fromPortable·assertExported는 제외).
describe('toPortable', () => {
	it('업로드는 filename, brand-colors는 hex로 접는다', () => {
		expect(toPortable({ image: { id: 7, filename: 'a.webp', url: '/x' } })).toEqual({
			image: { file: 'a.webp' },
		})
		expect(toPortable({ bg: { id: 2, hex: '#123456' } })).toEqual({ bg: { color: '#123456' } })
	})

	it('rules는 populate된 정의가 아니라 자연키 key로 접는다', () => {
		// 🔴 checker가 환경별 id라 객체째로 담으면 대상 DB의 relationship 검증이 실패한다.
		const rule = {
			title: 'English typography',
			key: 'typography-english',
			tier: 'required',
			executor: 'heuristic',
			checker: 49,
		}
		expect(toPortable({ rules: [rule] })).toEqual({ rules: [{ rule: 'typography-english' }] })
	})

	it('tier·executor가 비어 있는 초안 rule도 접는다', () => {
		// 🔴 rules는 초안 저장 시 검증을 건너뛰므로 required 필드가 null일 수 있다. 값으로 판정하면
		//    그 초안이 객체째로 정본에 들어가 대상 DB에서 seed가 죽는다.
		const draft = { title: 'WIP', key: 'wip-rule', tier: null, executor: null, checker: 51 }
		expect(toPortable({ rules: [draft] })).toEqual({ rules: [{ rule: 'wip-rule' }] })
	})

	it('key가 있어도 rules 필수 필드가 없으면 접지 않는다', () => {
		expect(toPortable({ meta: { key: 'a', label: 'b' } })).toEqual({
			meta: { key: 'a', label: 'b' },
		})
	})

	it('환경 종속 메타(id·createdAt·updatedAt)와 null을 버린다', () => {
		expect(
			toPortable({ id: 1, createdAt: 'x', updatedAt: 'y', keep: 'z', drop: null }),
		).toEqual({
			keep: 'z',
		})
	})
})

describe('collectFileRefs', () => {
	it('중첩된 곳의 file 참조를 중복 없이 모은다', () => {
		const refs = collectFileRefs([
			{ blocks: [{ cells: [{ image: { file: 'a.webp' } }, { image: { file: 'b.svg' } }] }] },
			{ blocks: [{ image: { file: 'a.webp' } }] },
		])
		expect([...refs].sort()).toEqual(['a.webp', 'b.svg'])
	})
})
