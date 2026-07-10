import type { CheckSection } from '@/features/asset-check/services/get-check-ruleset.service'
import { toCheckAnchor } from '@/features/asset-check/utils/check-anchor'

export function CheckCatalog({ sections }: { sections: CheckSection[] }) {
	return (
		<div className="divide-y divide-border">
			{sections.map((section) => (
				<section key={section.slug} id={section.slug} className="scroll-mt-16 py-10">
					<p className="mb-2 text-muted-foreground text-sm">
						{section.chapterTitle} / {section.sectionTitle}
					</p>
					<h2 className="text-2xl">{section.title}</h2>
					<div className="mt-6 divide-y divide-border">
						{section.checks.map((check) => (
							<article
								key={`${section.slug}:${check.key}`}
								id={toCheckAnchor(section.slug, check.key)}
								className="grid scroll-mt-16 gap-3 py-5 md:grid-cols-[18rem_1fr]"
							>
								<div>
									<h3 className="font-medium">{check.title}</h3>
									<code className="mt-2 block text-muted-foreground text-xs">
										{check.key}
									</code>
								</div>
								<div className="space-y-2 text-sm">
									<p className="text-muted-foreground">
										{check.evidence || '관련 가이드라인 없음'}
									</p>
									<p className="text-muted-foreground text-xs">
										{check.executor}
										{check.implemented ? '' : ' / 미구현'}
									</p>
									<CheckMessages messages={check.messages} />
								</div>
							</article>
						))}
					</div>
				</section>
			))}
		</div>
	)
}

function CheckMessages({ messages }: { messages: CheckSection['checks'][number]['messages'] }) {
	const entries = [
		['pass', messages?.pass],
		['ok', messages?.ok],
		['needs_review', messages?.needs_review],
		['fail', messages?.fail],
	].filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== '')

	if (entries.length === 0) return null

	return (
		<dl className="grid gap-1 rounded-md bg-secondary/50 p-3 text-xs">
			{entries.map(([status, message]) => (
				<div key={status} className="grid gap-2 md:grid-cols-[6rem_1fr]">
					<dt className="font-medium">{status}</dt>
					<dd className="text-muted-foreground">{message}</dd>
				</div>
			))}
		</dl>
	)
}
