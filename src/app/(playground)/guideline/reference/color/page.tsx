import { ColorReference } from '@/components/guideline/reference/color'
import { findPaletteCatalog } from '@/features/guideline/repositories/palette.payload.repository'

export default async function ColorPage() {
	return <ColorReference catalog={await findPaletteCatalog()} />
}
