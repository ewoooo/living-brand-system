import { ThemeToggle } from '@/components/ui/theme-toggle'

export function GuidelineFooter({ companyName }: { companyName: string }) {
	return (
		<footer className="type-callout w-full max-w-[1600px] text-foreground-muted">
			<section className="flex w-full items-center justify-between py-6">
				<p className="opacity-50">© {companyName}. 모든 권리 보유.</p>
				<ThemeToggle />
			</section>
		</footer>
	)
}
