import { ThemeToggle } from '@/components/ui/theme-toggle'
import { getGuidelineMetadata } from '@/features/guideline/services/get-guideline-metadata.service'

export async function GlobalFooter() {
	const { companyName } = await getGuidelineMetadata()

	return (
		<footer className="mx-auto w-full px-4 font-body text-sm font-normal text-muted-foreground">
			<section className="flex w-full items-center justify-between py-2">
				<p className="opacity-50">© {companyName}. All rights reserved.</p>
				<ThemeToggle />
			</section>
		</footer>
	)
}
