
const logger = (message, object, error = false) => {
	const args = object ? [`${ message }: `, object] : [`${ message }`],
		  type = error ? 'error' : 'log';

	if (console) {
		console[type].apply(console, args)
	}
}

export { logger };
