import type { GuidelineControllerManifest } from '@/features/guideline/controllers/contract'
import { LANGUAGES } from '../brand-typeface'

export const LANGUAGE = {
	id: 'typeLanguage',
	kind: 'select',
	label: '본문 언어',
	defaultValue: 'ko',
	options: LANGUAGES.map(({ key, label }) => ({ value: key, label })),
} as const
export const TYPE_LANGUAGE_MANIFEST = {
	id: 'type-language',
	groups: [{ id: 'language', title: '언어', controls: [LANGUAGE] }],
} satisfies GuidelineControllerManifest
