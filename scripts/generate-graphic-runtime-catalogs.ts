import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REQUIRED_FILES = ['definition.ts', 'model.ts', 'runtime.client.ts'] as const
const GENERATED_HEADER =
	'// 이 파일은 scripts/generate-graphic-runtime-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.\n\n'

export interface GraphicRuntimeRegistration {
	directory: string
	symbol: string
}

function kebabToCamel(value: string): string {
	return value.replace(/-([a-z0-9])/g, (_, character: string) => character.toUpperCase())
}

export async function discoverGraphicRuntimeRegistrations(
	runtimesDirectory: string,
): Promise<GraphicRuntimeRegistration[]> {
	const entries = await readdir(runtimesDirectory, { withFileTypes: true })
	const directories = entries
		.filter((entry) => entry.isDirectory() && entry.name !== 'catalog')
		.map((entry) => entry.name)
		.sort((left, right) => left.localeCompare(right))

	return Promise.all(
		directories.map(async (directory) => {
			if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(directory)) {
				throw new Error(`Graphic runtime 폴더 이름은 kebab-case여야 합니다: ${directory}`)
			}

			for (const file of REQUIRED_FILES) {
				try {
					await access(path.join(runtimesDirectory, directory, file))
				} catch {
					throw new Error(`Graphic runtime 계약 파일이 없습니다: ${directory}/${file}`)
				}
			}

			const definition = await readFile(
				path.join(runtimesDirectory, directory, 'definition.ts'),
				'utf8',
			)
			const id = definition.match(/\bid\s*:\s*['"]([^'"]+)['"]/)?.[1]
			if (id !== directory) {
				throw new Error(
					`Graphic runtime id는 폴더 이름과 일치하는 문자열 리터럴이어야 합니다: ${directory}/definition.ts`,
				)
			}

			return { directory, symbol: kebabToCamel(directory) }
		}),
	)
}

function renderManifestCatalog(runtimes: GraphicRuntimeRegistration[]): string {
	const imports = runtimes
		.map(
			({ directory, symbol }) => `import ${symbol}Manifest from '../${directory}/definition'`,
		)
		.join('\n')
	return `${GENERATED_HEADER}${imports}

export const graphicRuntimeManifests = [
${runtimes.map(({ directory, symbol }) => `\t${symbol}Manifest, // ${directory}`).join('\n')}
] as const

export type GraphicRuntimeId = (typeof graphicRuntimeManifests)[number]['id']
`
}

function renderModelCatalog(runtimes: GraphicRuntimeRegistration[]): string {
	const imports = runtimes
		.map(
			({ directory, symbol }) =>
				`import ${symbol}Manifest from '../${directory}/definition'\nimport ${symbol}Model from '../${directory}/model'`,
		)
		.join('\n')
	const entries = runtimes
		.map(({ symbol }) => `\t{ manifest: ${symbol}Manifest, ...${symbol}Model },`)
		.join('\n')

	return `${GENERATED_HEADER}import type { GraphicStudioPlugin } from '../../runtime/graphic-plugin'
${imports}

export const graphicStudioPlugins = [
${entries}
] as const satisfies readonly GraphicStudioPlugin[]
`
}

function renderClientRuntimeCatalog(runtimes: GraphicRuntimeRegistration[]): string {
	const imports = runtimes
		.map(
			({ directory, symbol }) =>
				`import ${symbol}Runtime from '../${directory}/runtime.client'`,
		)
		.join('\n')
	const entries = runtimes
		.map(({ directory, symbol }) => `\t'${directory}': ${symbol}Runtime,`)
		.join('\n')

	return `${GENERATED_HEADER}'use client'

import type { GraphicRuntimeAdapter } from '../../runtime/client/graphic-runtime.client'
${imports}
import type { GraphicRuntimeId } from './manifest.generated'

export const graphicRuntimeCatalog = {
${entries}
} satisfies Record<GraphicRuntimeId, GraphicRuntimeAdapter>
`
}

export function renderGraphicRuntimeCatalogs(
	runtimes: GraphicRuntimeRegistration[],
): Record<string, string> {
	return {
		'manifest.generated.ts': renderManifestCatalog(runtimes),
		'model.generated.ts': renderModelCatalog(runtimes),
		'runtime.generated.client.ts': renderClientRuntimeCatalog(runtimes),
	}
}

export async function generateGraphicRuntimeCatalogs({
	runtimesDirectory,
	check,
}: {
	runtimesDirectory: string
	check: boolean
}): Promise<void> {
	const runtimes = await discoverGraphicRuntimeRegistrations(runtimesDirectory)
	const catalogDirectory = path.join(runtimesDirectory, 'catalog')
	const catalogs = renderGraphicRuntimeCatalogs(runtimes)
	const staleFiles: string[] = []

	if (!check) await mkdir(catalogDirectory, { recursive: true })

	for (const [fileName, content] of Object.entries(catalogs)) {
		const filePath = path.join(catalogDirectory, fileName)
		const current = await readFile(filePath, 'utf8').catch(() => null)
		if (current === content) continue
		if (check) staleFiles.push(fileName)
		else await writeFile(filePath, content)
	}

	if (staleFiles.length > 0) {
		throw new Error(
			`생성된 Graphic runtime 카탈로그가 최신이 아닙니다: ${staleFiles.join(', ')}. pnpm generate:graphic-runtime-catalogs를 실행하세요.`,
		)
	}
}

const scriptPath = fileURLToPath(import.meta.url)
const runtimesDirectory = path.resolve(
	path.dirname(scriptPath),
	'../src/features/graphic-generation/graphic-runtimes',
)

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
	generateGraphicRuntimeCatalogs({
		runtimesDirectory,
		check: process.argv.includes('--check'),
	}).catch((error: unknown) => {
		console.error(error instanceof Error ? error.message : error)
		process.exitCode = 1
	})
}
