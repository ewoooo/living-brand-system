export type CheckReferenceAssetRole = 'positive' | 'negative' | 'context'

export interface CheckReferenceAssetRef {
	id: number
	role: CheckReferenceAssetRole
}

export type CheckBlockEvidence =
	| {
			type: 'columnUnit'
			columns: { heading?: string; body?: string }[]
	  }
	| { type: 'mediaShowcase' }
	| {
			type: 'colorPalette'
			title?: string
			colors: { name: string; hex: string; pantone?: string }[]
	  }
	| {
			type: 'doDont'
			title?: string
			groups: {
				category?: string
				description?: string
				kind: 'do' | 'ok' | 'dont'
				examples: { caption?: string }[]
			}[]
	  }

export type CheckEvidence =
	| CheckBlockEvidence
	| {
			type: 'document'
			description?: string
			blocks: CheckBlockEvidence[]
	  }

export interface CheckSourceSnapshot {
	evidence: CheckEvidence
	referenceAssets: CheckReferenceAssetRef[]
}

export interface BlockCheckSourceSnapshot {
	evidence: CheckBlockEvidence
	referenceAssets: CheckReferenceAssetRef[]
}
