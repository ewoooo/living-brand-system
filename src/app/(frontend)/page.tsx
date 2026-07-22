import { GlobalFooter } from '@/components/global/footer/global-footer'
import { HeroSection } from '@/components/global/hero/hero-section'

export default function HomePage() {
	return (
		<main className="flex h-full flex-col">
			<HeroSection />
			<GlobalFooter />
		</main>
	)
}
