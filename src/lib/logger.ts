type LogMeta = Record<string, unknown>

export const logger = {
	info(message: string, meta?: LogMeta) {
		void message
		void meta
	},
	warn(message: string, meta?: LogMeta) {
		void message
		void meta
	},
	error(message: string, meta?: LogMeta) {
		void message
		void meta
	},
}
