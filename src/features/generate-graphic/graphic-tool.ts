import type { z } from 'zod'

export type GraphicControlSpec<Input> =
	| {
			key: Extract<keyof Input, string>
			type: 'boolean'
			label: string
	  }
	| {
			key: Extract<keyof Input, string>
			type: 'select'
			label: string
			options: readonly {
				value: string
				label: string
			}[]
	  }

export type GraphicToolContract<Input> = {
	implementationKey: string
	inputSchema: z.ZodType<Input>
	defaultInput: Input
	controls: readonly GraphicControlSpec<Input>[]
	outputFormats: readonly {
		format: string
		mimeType: string
	}[]
}
