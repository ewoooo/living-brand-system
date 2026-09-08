import type { GuidelineControllerManifest } from '@/features/guideline/controllers/contract'
import { SAMPLE_PARAGRAPH, TIERS } from '../brand-typeface'

export const TYPE_HIERARCHY_MANIFEST = {
	id: 'type-hierarchy',
	groups: [
		{
			id: 'texts',
			title: '표본 문구',
			controls: TIERS.map(({ key, label }) => ({
				id: key,
				kind: 'text' as const,
				label: `${label} 문구`,
				multiline: true,
				defaultValue: SAMPLE_PARAGRAPH.ko[key],
			})),
		},
	],
} satisfies GuidelineControllerManifest
