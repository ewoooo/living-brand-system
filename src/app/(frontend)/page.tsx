import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function HomePage() {
	return (
		<article className="space-y-4 bg-white text-black dark:bg-black dark:text-white">
			<h1>Digital Guideline</h1>
			<ThemeToggle />
		</article>
	)
}
