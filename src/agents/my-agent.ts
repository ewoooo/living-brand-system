export interface MyAgentInput {
	prompt: string
}

export interface MyAgentOutput {
	answer: string
}

export async function runMyAgent(input: MyAgentInput): Promise<MyAgentOutput> {
	return {
		answer: `mock agent answer: ${input.prompt}`,
	}
}
