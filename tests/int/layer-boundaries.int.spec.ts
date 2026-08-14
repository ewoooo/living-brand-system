import { globSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// import '...' / import { A } from '...' / import type { A } from '...' / import * as ns from '...'
const IMPORT_FROM =
	/^\s*import\s+(?:type\s+)?(?:\*\s+as\s+\w+|\w+(?:\s*,\s*\{[^}]*\})?|\{[^}]*\})\s+from\s*['"]([^'"]+)['"]/gm
// export { A } from '...' / export * from '...' / export type { A } from '...'
const EXPORT_FROM =
	/^\s*export\s+(?:type\s+)?(?:\*(?:\s+as\s+\w+)?|\{[^}]*\})\s+from\s*['"]([^'"]+)['"]/gm

function isSourceFile(file: string): boolean {
	return !/\.(test|spec)\./.test(file) && !file.includes('__snapshots__')
}

function violations(files: string[], isForbidden: (specifier: string) => boolean): string[] {
	const found: string[] = []
	for (const file of files.filter(isSourceFile)) {
		const content = readFileSync(file, 'utf8')
		for (const re of [IMPORT_FROM, EXPORT_FROM]) {
			for (const match of content.matchAll(re)) {
				const specifier = match[1]
				if (!specifier || !isForbidden(specifier)) continue
				const line = content.slice(0, match.index).split('\n').length
				found.push(`${file}:${line} -> ${specifier}`)
			}
		}
	}
	return found
}

describe('layer boundaries', () => {
	// docs/06-project-structure.md §1: Presentation -> Service -> Repository.
	// Route/component 코드는 Payload/ORM 구현을 감춘 repository를 직접 몰라야 한다.
	it('app과 components는 repository를 직접 import하지 않는다', () => {
		const files = globSync(['src/app/**/*.ts*', 'src/components/**/*.ts*'])
		const found = violations(files, (specifier) => specifier.includes('/repositories/'))

		expect(found).toEqual([])
	})

	// docs/06-project-structure.md §2: 의존 방향은 app -> components -> features이며
	// features는 components를 import하지 않는다. src/features/guideline/**는 Guideline
	// 분류를 별도로 정리하기 전까지의 한시적 예외로 문서에 명시되어 있다.
	it('features는 components를 import하지 않는다 (guideline 한시적 예외 제외)', () => {
		const files = globSync('src/features/**/*.ts*').filter(
			(file) => !file.startsWith('src/features/guideline/'),
		)
		const found = violations(files, (specifier) => specifier.startsWith('@/components'))

		expect(found).toEqual([])
	})
})
