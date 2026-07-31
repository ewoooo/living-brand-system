import { redirect } from 'next/navigation'
import { routes } from '@/lib/routes'

export default function LoginPage() {
	redirect(routes.admin)
}
