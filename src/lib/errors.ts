export class AgentConfigurationError extends Error {
	constructor(message = 'Agent is not configured.') {
		super(message)
		this.name = 'AgentConfigurationError'
	}
}

/** 에셋 영속화가 컬렉션 접근 제어에 막혔을 때 — 라우트가 403으로 변환한다. */
export class AssetAccessDeniedError extends Error {
	constructor(message = 'Not allowed to save template assets.') {
		super(message)
		this.name = 'AssetAccessDeniedError'
	}
}

export class FigmaConfigurationError extends Error {
	constructor(message = 'Figma integration is not configured.') {
		super(message)
		this.name = 'FigmaConfigurationError'
	}
}
