import { redirect } from 'next/navigation'
import { routes } from '@/lib/routes'

export default function GeneratePage() {
	redirect(routes.studio.generateImage)
}
