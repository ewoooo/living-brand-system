import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// 위젯이 색을 **공유 어휘로만** 말하는지 지킨다(계약은 `docs/11` §8, 토큰 규칙은 `docs/09` §4).
//
// 🔴 왜 필요한가: 위젯 19개가 반복되는 시각 요소를 각자 만들어, 한 페이지 안에서 같은 것이 다르게
//    표기됐다. 그걸 정리한 뒤에도 새 위젯이 같은 길로 다시 갈 수 있고, 생 팔레트는 리뷰에서
//    "그냥 회색"처럼 보여 지적되지 않는다. 잘못된 색은 다크 모드나 색을 주입한 블록 면에서만
//    드러나므로 화면을 눌러 보지 않으면 아무도 못 본다.
//
// 예외는 `surface.ts` 하나다. 표본이 얹히는 브랜드 면은 흰 판/검은 판 자체가 규정의 일부라
// 테마를 따르면 안 되고, 그 예외를 한 파일에 모아 두는 것이 이 규칙의 설계다.

const WIDGETS = path.join(process.cwd(), 'src/features/guideline/widgets')

/** 브랜드 면의 고정 팔레트를 갖는 유일한 자리. */
const DECLARED_EXCEPTION = 'surface.ts'

const PALETTE = [
	'slate',
	'gray',
	'zinc',
	'neutral',
	'stone',
	'red',
	'orange',
	'amber',
	'yellow',
	'lime',
	'green',
	'emerald',
	'teal',
	'cyan',
	'sky',
	'blue',
	'indigo',
	'violet',
	'purple',
	'fuchsia',
	'pink',
	'rose',
].join('|')

const PROPERTY =
	'bg|text|border|fill|stroke|ring|outline|accent|caret|decoration|divide|shadow|from|via|to'

/**
 * 생 팔레트 유틸리티.
 *
 * 🔴 `white`·`black`이 반드시 들어가야 한다. 앞선 탐지 grep은 `-[0-9]`만 봤고, 숫자가 없는
 *    `bg-white`는 그 구멍으로 실제로 통과했다. 색 단계가 없는 이름이 가장 잘 숨는다.
 */
const RAW_COLOR = new RegExp(
	`\\b(?:${PROPERTY})-(?:white|black|(?:${PALETTE})-\\d{2,3})(?:\\/\\d{1,3})?\\b`,
)

/**
 * `dark:` 변형.
 *
 * 🔴 위젯은 다크 모드를 스스로 분기하지 않는다. 색을 주입한 블록 면은 그 면에서 토큰 스코프를
 *    `light`/`dark`로 다시 선언하는데(`blocks/block/component.tsx`), Tailwind의 `dark:`는
 *    `.dark *` 후손 선택자라 **다크 페이지 안의 밝은 섬에서도 여전히 걸린다.** 토큰만 쓰면
 *    스코프가 알아서 따라오므로 분기가 필요하지 않다.
 */
const DARK_VARIANT = /\bdark:/

function sourceFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((entry) => {
		const full = path.join(dir, entry)
		if (statSync(full).isDirectory()) return sourceFiles(full)
		return /\.tsx?$/.test(entry) && !entry.endsWith('.test.ts') ? [full] : []
	})
}

function offendingLines(file: string, pattern: RegExp): string[] {
	return readFileSync(file, 'utf8')
		.split('\n')
		.map((line, index) => [index + 1, line] as const)
		.filter(([, line]) => pattern.test(line))
		.map(([number, line]) => `${number}: ${line.trim()}`)
}

describe('위젯 시각 어휘', () => {
	const files = sourceFiles(WIDGETS).filter((file) => path.basename(file) !== DECLARED_EXCEPTION)

	// 🔴 탐지가 조용히 0건이 되면 이 테스트 전체가 "문제 없음"을 승인하는 도장으로 바뀐다.
	//    보지 않는 것은 통과시키는 것과 구별되지 않으므로, 무엇을 봤는지를 먼저 확인한다.
	it('위젯 소스를 실제로 훑는다', () => {
		expect(files.length).toBeGreaterThan(30)
	})

	it('생 팔레트 패턴이 실제 위반을 잡는다', () => {
		// 전부 리포에서 실제로 걷어낸 문자열이다.
		for (const sample of [
			'bg-white',
			'bg-black',
			'text-white/70',
			'bg-neutral-900 text-white',
			'text-neutral-600',
			'bg-neutral-50 dark:bg-neutral-950',
		]) {
			expect(RAW_COLOR.test(sample), sample).toBe(true)
		}
	})

	it('생 팔레트 패턴이 시맨틱 토큰을 잡지 않는다', () => {
		for (const sample of [
			'bg-background text-foreground',
			'bg-muted text-muted-foreground',
			'bg-primary text-primary-foreground',
			'border-border bg-card',
			'text-destructive',
			'ring-ring/30 outline-none',
			'font-mono text-xs tabular-nums',
			'border-b-2 stroke-2',
		]) {
			expect(RAW_COLOR.test(sample), sample).toBe(false)
		}
	})

	it.each(
		files.map((file) => [path.relative(WIDGETS, file), file]),
	)('%s 가 생 팔레트를 쓰지 않는다', (_label, file) => {
		expect(offendingLines(file, RAW_COLOR)).toEqual([])
	})

	it.each(
		files.map((file) => [path.relative(WIDGETS, file), file]),
	)('%s 가 dark: 변형으로 분기하지 않는다', (_label, file) => {
		expect(offendingLines(file, DARK_VARIANT)).toEqual([])
	})
})
