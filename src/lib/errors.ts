export class MyAppError extends Error {
	constructor(message = 'Unexpected error') {
		super(message)
		this.name = 'MyAppError'
	}
}
