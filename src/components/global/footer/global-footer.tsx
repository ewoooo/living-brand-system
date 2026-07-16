import { ThemeToggle } from '@/components/ui/theme-toggle'
import { getGuidelineMetadata } from '@/features/guideline/services/get-guideline-metadata.service'

export async function GlobalFooter() {
	const { companyName } = await getGuidelineMetadata()

	return (
		<footer className="type-callout mx-auto w-full max-w-[1600px] text-muted-foreground">
			<section className="flex w-full items-center justify-between py-6">
				<p className="opacity-50">© {companyName}. 모든 권리 보유.</p>
				<ThemeToggle />
			</section>
		</footer>
	)
}
