import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { discoverBlockRegistrations } from '../../../../scripts/generate-guideline-block-catalogs'

const temporaryDirectories: string[] = []

async function createTemporaryBlocksDirectory(): Promise<string> {
	const directory = await mkdtemp(path.join(tmpdir(), 'guideline-blocks-'))
	temporaryDirectories.push(directory)
	return directory
}

async function createBlock(
	blocksDirectory: string,
	name: string,
	files = ['schema.ts', 'projection.ts', 'component.tsx'],
): Promise<void> {
	const blockDirectory = path.join(blocksDirectory, name)
	await mkdir(blockDirectory, { recursive: true })
	await Promise.all(files.map((file) => writeFile(path.join(blockDirectory, file), '')))
}

afterEach(async () => {
	await Promise.all(
		temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
	)
})

describe('guideline catalog generator', () => {
	it('기존 노출 순서를 보존하고 새 블록은 뒤에 이름순으로 등록한다', async () => {
		const blocksDirectory = await createTemporaryBlocksDirectory()
		await createBlock(blocksDirectory, 'block')
		await createBlock(blocksDirectory, 'section')
		await createBlock(blocksDirectory, 'zeta-new')
		await createBlock(blocksDirectory, 'alpha-new')
		await mkdir(path.join(blocksDirectory, 'shared'))

		await expect(discoverBlockRegistrations(blocksDirectory)).resolves.toEqual([
			{ directory: 'section', key: 'section', symbol: 'Section' },
			{ directory: 'block', key: 'block', symbol: 'Block' },
			{ directory: 'alpha-new', key: 'alphaNew', symbol: 'AlphaNew' },
			{ directory: 'zeta-new', key: 'zetaNew', symbol: 'ZetaNew' },
		])
	})

	it('계약 파일이 빠진 블록은 생성 전에 거부한다', async () => {
		const blocksDirectory = await createTemporaryBlocksDirectory()
		await createBlock(blocksDirectory, 'missing-renderer', ['schema.ts', 'projection.ts'])

		await expect(discoverBlockRegistrations(blocksDirectory)).rejects.toThrow(
			'블록 계약 파일이 없습니다: missing-renderer/component.tsx',
		)
	})
})
