import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Typography } from '@/components/ui/typography'
import { getGuidelineMetadata } from '@/features/guideline/services/get-guideline-metadata.service'

export async function GlobalFooter() {
	const { companyName } = await getGuidelineMetadata()

	return (
		<footer className="mx-auto w-full px-4 font-body text-sm font-normal text-muted-foreground">
			<section className="flex w-full items-center justify-between py-2">
				<Typography as="p" size="xs">
					© {companyName}. All rights reserved.
				</Typography>
				<ThemeToggle />
			</section>
		</footer>
	)
}
