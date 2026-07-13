import { ThemeToggle } from '@/components/ui/theme-toggle'

export function GuidelineFooter({ companyName }: { companyName: string }) {
	return (
		<footer className="max-w-[1600px] w-full text-muted-foreground text-sm">
			<section className="flex w-full items-center justify-between py-6">
				<p className="text-neutral-300 dark:text-neutral-700">
					© {companyName}. 모든 권리 보유.
				</p>
				<ThemeToggle />
			</section>
		</footer>
	)
}
