
const logger = (message, object, error = false) => {
	const args = object ? [`${ message }: `, object] : [`${ message }`],
		  type = error ? 'error' : 'log';

	if (console) {
		console[type].apply(console, args)
	}
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function p(path) {
  return path.split('.');
}

export { logger, capitalize, p };
