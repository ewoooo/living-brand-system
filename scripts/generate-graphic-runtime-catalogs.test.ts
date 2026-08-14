import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
	discoverGraphicRuntimeRegistrations,
	generateGraphicRuntimeCatalogs,
} from './generate-graphic-runtime-catalogs'

const temporaryDirectories: string[] = []

async function createTemporaryRuntimesDirectory(): Promise<string> {
	const directory = await mkdtemp(path.join(tmpdir(), 'graphic-runtimes-'))
	temporaryDirectories.push(directory)
	return directory
}

async function createRuntime(
	runtimesDirectory: string,
	name: string,
	options: { id?: string; files?: readonly string[] } = {},
): Promise<void> {
	const runtimeDirectory = path.join(runtimesDirectory, name)
	await mkdir(runtimeDirectory, { recursive: true })
	const files = options.files ?? ['definition.ts', 'model.ts', 'runtime.client.ts']
	await Promise.all(
		files.map((file) =>
			writeFile(
				path.join(runtimeDirectory, file),
				file === 'definition.ts' ? `export default { id: '${options.id ?? name}' }` : '',
			),
		),
	)
}

afterEach(async () => {
	await Promise.all(
		temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
	)
})

describe('graphic runtime catalog generator', () => {
	it('자산 폴더를 이름순으로 발견한다', async () => {
		const directory = await createTemporaryRuntimesDirectory()
		await createRuntime(directory, 'zeta-runtime')
		await createRuntime(directory, 'alpha-runtime')

		await expect(discoverGraphicRuntimeRegistrations(directory)).resolves.toEqual([
			{ directory: 'alpha-runtime', symbol: 'alphaRuntime' },
			{ directory: 'zeta-runtime', symbol: 'zetaRuntime' },
		])
	})

	it('계약 파일 누락과 폴더명에 불일치하는 id를 거부한다', async () => {
		const missingDirectory = await createTemporaryRuntimesDirectory()
		await createRuntime(missingDirectory, 'missing-runtime', {
			files: ['definition.ts', 'model.ts'],
		})
		await expect(discoverGraphicRuntimeRegistrations(missingDirectory)).rejects.toThrow(
			'missing-runtime/runtime.client.ts',
		)

		const mismatchDirectory = await createTemporaryRuntimesDirectory()
		await createRuntime(mismatchDirectory, 'folder-id', { id: 'manifest-id' })
		await expect(discoverGraphicRuntimeRegistrations(mismatchDirectory)).rejects.toThrow(
			'id는 폴더 이름과 일치',
		)
	})

	it('생성 파일이 없거나 오래되면 check를 실패한다', async () => {
		const directory = await createTemporaryRuntimesDirectory()
		await createRuntime(directory, 'example')

		await expect(
			generateGraphicRuntimeCatalogs({ runtimesDirectory: directory, check: true }),
		).rejects.toThrow('최신이 아닙니다')
		await generateGraphicRuntimeCatalogs({ runtimesDirectory: directory, check: false })
		await expect(
			generateGraphicRuntimeCatalogs({ runtimesDirectory: directory, check: true }),
		).resolves.toBeUndefined()
	})
})
