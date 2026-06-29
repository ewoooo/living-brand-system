export function GuidelineFooter({ companyName }: { companyName: string }) {
	return (
		<footer className="px-8 py-6 text-muted-foreground text-sm">
			© {companyName}. All rights reserved.
		</footer>
	)
}
