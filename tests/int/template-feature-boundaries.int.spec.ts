import { globSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const forbiddenImports: Record<string, string[]> = {
	'template-export': ['template-import'],
}

describe('template feature boundaries', () => {
	it('keeps import and export dependencies one-way', () => {
		for (const [feature, forbiddenFeatures] of Object.entries(forbiddenImports)) {
			const source = globSync(`src/features/${feature}/**/*.ts*`)
				.map((file) => readFileSync(file, 'utf8'))
				.join('\n')

			for (const forbiddenFeature of forbiddenFeatures) {
				expect(source).not.toContain(`@/features/${forbiddenFeature}/`)
			}
		}
	})
})
