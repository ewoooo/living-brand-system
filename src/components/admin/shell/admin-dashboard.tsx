import { Add } from '@carbon/icons-react'
import { getTranslation } from '@payloadcms/translations'
import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'
import { cn } from '@/lib/utils'
import { AdminHero } from './admin-hero'
import {
	DASHBOARD_CARD_BLOCKS,
	DASHBOARD_PLAIN_BLOCKS,
	DASHBOARD_SYSTEM_BLOCK,
	type DashboardBlock,
	type DashboardEntry,
} from './dashboard-blocks'

/** 링크 하나를 그리는 데 필요한 것 — 라벨과 목적지. 만들 수 없는 자원은 `createHref`가 없다. */
type ResolvedEntry = {
	href: string
	label: string
	createHref?: string
}

/** 권한과 config를 통과한 뒤의 블록. 원본과 달리 slug가 아니라 그릴 것만 남는다. */
type ResolvedBlock = {
	entries: ResolvedEntry[]
	title: string
	wide?: boolean
}

/**
 * Payload 기본 대시보드를 대신한다. 기본 화면은 사이드바의 `admin.group`을 그대로 카드로 펴는데,
 * 디자인은 그와 다른 묶음을 요구한다(`dashboard-blocks.ts`).
 *
 * 라벨은 config가, 무엇을 보일지는 권한이 정한다 — 읽을 수 없는 자원은 줄 자체를 그리지 않는다.
 */
export async function AdminDashboard({ initPageResult }: AdminViewServerProps) {
	const { permissions, req } = initPageResult
	const { config } = req.payload
	const adminRoute = config.routes.admin

	function resolve(entry: DashboardEntry): null | ResolvedEntry {
		if (entry.kind === 'global') {
			const global = config.globals.find((candidate) => candidate.slug === entry.slug)
			if (!global || !permissions.globals?.[entry.slug]?.read) return null
			return {
				href: `${adminRoute}/globals/${entry.slug}`,
				label: getTranslation(global.label ?? entry.slug, req.i18n),
			}
		}

		const collection = config.collections.find((candidate) => candidate.slug === entry.slug)
		if (!collection || !permissions.collections?.[entry.slug]?.read) return null
		return {
			createHref: permissions.collections[entry.slug]?.create
				? `${adminRoute}/collections/${entry.slug}/create`
				: undefined,
			href: `${adminRoute}/collections/${entry.slug}`,
			label: getTranslation(collection.labels?.plural ?? entry.slug, req.i18n),
		}
	}

	function resolveBlock(block: DashboardBlock): null | ResolvedBlock {
		const entries = block.entries.map(resolve).filter((entry) => entry !== null)
		return entries.length > 0 ? { entries, title: block.title, wide: block.wide } : null
	}

	const cardBlocks = DASHBOARD_CARD_BLOCKS.map(resolveBlock).filter((block) => block !== null)
	const plainBlocks = DASHBOARD_PLAIN_BLOCKS.map(resolveBlock).filter((block) => block !== null)
	const systemBlock = resolveBlock(DASHBOARD_SYSTEM_BLOCK)

	return (
		<div className="flex flex-col gap-[12px] px-[60px] py-[12px]">
			<AdminHero />

			<div className="grid grid-cols-1 gap-[12px] md:grid-cols-2">
				{cardBlocks.map((block) => (
					<CardBlock block={block} key={block.title} />
				))}
			</div>

			<div className="grid grid-cols-1 gap-[12px] md:grid-cols-3">
				{plainBlocks.map((block) => (
					<PlainBlock block={block} key={block.title} />
				))}
			</div>

			{systemBlock ? <PlainBlock block={systemBlock} /> : null}
		</div>
	)
}

function CardBlock({ block }: { block: ResolvedBlock }) {
	return (
		<section className={cardClassName(block.wide)} data-slot="admin-dashboard-card">
			<h2 className="font-medium text-[26px] text-brand-deep leading-[32px]">
				{block.title}
			</h2>
			<ul className="m-0 flex list-none flex-col items-start gap-[6px] p-0">
				{block.entries.map((entry) => (
					<li key={entry.href}>
						<span
							className="flex h-[44px] items-center gap-[16px] rounded-[24px] border border-brand-tint/10 bg-background/60 py-[16px] pr-[10px] pl-[16px] data-[bare=true]:pr-[16px]"
							data-bare={!entry.createHref}
						>
							<Link
								className="font-semibold text-[13px] text-brand-deep leading-[16px] no-underline"
								href={entry.href}
							>
								{entry.label}
							</Link>
							{entry.createHref ? <CreateLink entry={entry} tone="brand" /> : null}
						</span>
					</li>
				))}
			</ul>
		</section>
	)
}

function cardClassName(wide?: boolean) {
	return cn(
		'flex min-h-[381px] flex-col justify-between gap-[16px] overflow-hidden rounded-[24px] bg-brand-tint/10 p-[16px] ring-1 ring-brand/20',
		wide && 'md:col-span-2',
	)
}

function PlainBlock({ block }: { block: ResolvedBlock }) {
	return (
		<section
			className="flex flex-col gap-[16px] border-border border-t p-[16px]"
			data-slot="admin-dashboard-list"
		>
			<h2 className="font-medium text-[20px] text-foreground leading-[32px]">
				{block.title}
			</h2>
			<ul className="m-0 flex list-none flex-col items-start gap-[6px] p-0">
				{block.entries.map((entry) => (
					<li className="flex items-center gap-[8px]" key={entry.href}>
						<Link
							className="font-semibold text-[13px] text-muted-foreground leading-[16px] no-underline"
							href={entry.href}
						>
							{entry.label}
						</Link>
						{entry.createHref ? <CreateLink entry={entry} tone="plain" /> : null}
					</li>
				))}
			</ul>
		</section>
	)
}

function CreateLink({ entry, tone }: { entry: ResolvedEntry; tone: 'brand' | 'plain' }) {
	if (!entry.createHref) return null
	return (
		<Link
			aria-label={`${entry.label} 새로 만들기`}
			className={cn(
				'flex size-[22px] items-center justify-center rounded-full border',
				tone === 'brand'
					? 'border-brand-tint/10 text-brand-deep'
					: 'border-border text-muted-foreground',
			)}
			href={entry.createHref}
		>
			<Add size={20} />
		</Link>
	)
}
