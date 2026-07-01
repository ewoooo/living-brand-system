export class AgentConfigurationError extends Error {
	constructor(message = 'Agent is not configured.') {
		super(message)
		this.name = 'AgentConfigurationError'
	}
}
