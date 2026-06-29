export class MyAppError extends Error {
	constructor(message = 'Unexpected error') {
		super(message)
		this.name = 'MyAppError'
	}
}

export class AgentConfigurationError extends Error {
	constructor(message = 'Agent is not configured.') {
		super(message)
		this.name = 'AgentConfigurationError'
	}
}
