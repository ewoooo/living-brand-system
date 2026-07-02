export class AgentConfigurationError extends Error {
	constructor(message = 'Agent is not configured.') {
		super(message)
		this.name = 'AgentConfigurationError'
	}
}

export class FigmaConfigurationError extends Error {
	constructor(message = 'Figma integration is not configured.') {
		super(message)
		this.name = 'FigmaConfigurationError'
	}
}
