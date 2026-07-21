import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REQUIRED_FILES = ['schema.ts', 'projection.ts', 'component.tsx'] as const
const RESERVED_DIRECTORIES = new Set(['catalog', 'runtime', 'shared'])
// 기존 Payload Admin의 블록 선택 순서를 유지한다. 새 블록은 이 목록 수정 없이 뒤에 이름순으로 붙는다.
const COMPATIBLE_BLOCK_ORDER = [
	'content-columns',
	'carousel',
	'media-showcase',
	'color-palette',
	'do-dont',
	'callout',
	'spec-list',
	'signature-showcase',
	'type-specimen',
	'type-scale',
	'layout-grid',
	'glyph-grid',
] as const
const GENERATED_HEADER =
	'// 이 파일은 scripts/generate-guideline-block-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.\n\n'

export interface BlockRegistration {
	directory: string
	key: string
	symbol: string
}

function kebabToCamel(value: string): string {
	return value.replace(/-([a-z0-9])/g, (_, character: string) => character.toUpperCase())
}

function kebabToPascal(value: string): string {
	const camel = kebabToCamel(value)
	return camel.charAt(0).toUpperCase() + camel.slice(1)
}

export async function discoverBlockRegistrations(
	blocksDirectory: string,
): Promise<BlockRegistration[]> {
	const entries = await readdir(blocksDirectory, { withFileTypes: true })
	const compatibleOrder = new Map<string, number>(
		COMPATIBLE_BLOCK_ORDER.map((directory, index) => [directory, index]),
	)
	const directories = entries
		.filter((entry) => entry.isDirectory() && !RESERVED_DIRECTORIES.has(entry.name))
		.map((entry) => entry.name)
		.sort((left, right) => {
			const leftOrder = compatibleOrder.get(left) ?? Number.POSITIVE_INFINITY
			const rightOrder = compatibleOrder.get(right) ?? Number.POSITIVE_INFINITY
			return leftOrder - rightOrder || left.localeCompare(right)
		})

	return Promise.all(
		directories.map(async (directory) => {
			if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(directory)) {
				throw new Error(`블록 폴더 이름은 kebab-case여야 합니다: ${directory}`)
			}

			for (const file of REQUIRED_FILES) {
				try {
					await access(path.join(blocksDirectory, directory, file))
				} catch {
					throw new Error(`블록 계약 파일이 없습니다: ${directory}/${file}`)
				}
			}

			return {
				directory,
				key: kebabToCamel(directory),
				symbol: kebabToPascal(directory),
			}
		}),
	)
}

function renderSchemaCatalog(blocks: BlockRegistration[]): string {
	const imports = [...blocks]
		.sort((left, right) => left.directory.localeCompare(right.directory))
		.map(({ directory, symbol }) => `import ${symbol}Schema from '../blocks/${directory}/schema'`)
		.join('\n')
	const entries = blocks.map(({ key, symbol }) => `\t${key}: ${symbol}Schema,`).join('\n')

	return `${GENERATED_HEADER}import type { Block } from 'payload'
${imports}
import type { GuidelineBlock } from '../blocks/types'

type SchemaMap = {
	[Type in GuidelineBlock['blockType']]: Block
}

export const guidelineBlockSchemas = {
${entries}
} satisfies SchemaMap

export const guidelineBlocks = Object.values(guidelineBlockSchemas)
`
}

function renderProjectionCatalog(blocks: BlockRegistration[]): string {
	const imports = [...blocks]
		.sort((left, right) => left.directory.localeCompare(right.directory))
		.map(({ directory, symbol }) => `import project${symbol} from '../blocks/${directory}/projection'`)
		.join('\n')
	const entries = blocks.map(({ key, symbol }) => `\t${key}: project${symbol},`).join('\n')

	return `${GENERATED_HEADER}${imports}
import type { BlockProjection, GuidelineBlock } from '../blocks/types'

type ProjectionMap = {
	[Type in GuidelineBlock['blockType']]: (
		block: Extract<GuidelineBlock, { blockType: Type }>,
	) => BlockProjection<unknown>
}

export const guidelineBlockProjectors = {
${entries}
} satisfies ProjectionMap

type RegisteredProjector = (typeof guidelineBlockProjectors)[GuidelineBlock['blockType']]
type RegisteredProjection = ReturnType<RegisteredProjector>

export type CheckBlockEvidence = RegisteredProjection['evidence']
`
}

function renderRendererCatalog(blocks: BlockRegistration[]): string {
	const imports = [...blocks]
		.sort((left, right) => left.directory.localeCompare(right.directory))
		.map(
			({ directory, symbol }) => `import ${symbol}Component from '../blocks/${directory}/component'`,
		)
		.join('\n')
	const entries = blocks
		.map(({ key, symbol }) => `\t${key}: (block) => <${symbol}Component block={block} />,`)
		.join('\n')

	return `${GENERATED_HEADER}import type { ReactNode } from 'react'
${imports}
import type { GuidelineBlock } from '../blocks/types'

type RendererMap = {
	[Type in GuidelineBlock['blockType']]: (
		block: Extract<GuidelineBlock, { blockType: Type }>,
	) => ReactNode
}

export const guidelineBlockRenderers = {
${entries}
} satisfies RendererMap
`
}

export function renderCatalogs(blocks: BlockRegistration[]): Record<string, string> {
	return {
		'projection.generated.ts': renderProjectionCatalog(blocks),
		'renderer.generated.tsx': renderRendererCatalog(blocks),
		'schema.generated.ts': renderSchemaCatalog(blocks),
	}
}

export async function generateGuidelineBlockCatalogs({
	blocksDirectory,
	check,
}: {
	blocksDirectory: string
	check: boolean
}): Promise<void> {
	const blocks = await discoverBlockRegistrations(blocksDirectory)
	const catalogDirectory = path.resolve(blocksDirectory, '../catalog')
	const catalogs = renderCatalogs(blocks)
	const staleFiles: string[] = []

	if (!check) await mkdir(catalogDirectory, { recursive: true })

	for (const [fileName, content] of Object.entries(catalogs)) {
		const filePath = path.join(catalogDirectory, fileName)
		const current = await readFile(filePath, 'utf8').catch(() => null)
		if (current === content) continue

		if (check) {
			staleFiles.push(fileName)
		} else {
			await writeFile(filePath, content)
		}
	}

	if (staleFiles.length > 0) {
		throw new Error(
			`생성된 블록 카탈로그가 최신이 아닙니다: ${staleFiles.join(', ')}. pnpm generate:block-catalogs를 실행하세요.`,
		)
	}
}

const scriptPath = fileURLToPath(import.meta.url)
const blocksDirectory = path.resolve(path.dirname(scriptPath), '../src/features/guideline/blocks')

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
	generateGuidelineBlockCatalogs({
		blocksDirectory,
		check: process.argv.includes('--check'),
	}).catch((error: unknown) => {
		console.error(error instanceof Error ? error.message : error)
		process.exitCode = 1
	})
}
