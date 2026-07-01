import { ThemeToggle } from '@/components/ui/theme-toggle'

export function GuidelineFooter({ companyName }: { companyName: string }) {
	return (
		<footer className="px-8 py-6 text-muted-foreground text-sm flex items-center justify-between w-full">
			<div>© {companyName}. All rights reserved.</div>
			<div>
				<ThemeToggle />
			</div>
		</footer>
	)
}
