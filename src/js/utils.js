import {rgb} from 'd3-color';


const alphaify = (color, opacity, brighter=0) => {
    var c = rgb(color).brighter(brighter);
    c.opacity = opacity;
    return String(c);
}

const logger = (message, object, error = false) => {
    const args = object ? [`${ message }: `, object] : [`${ message }`],
          type = error ? 'error' : 'log';

    if (console) {
        console[type].apply(console, args) // eslint-disable-line no-console
    }
}

const capitalize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const p = (path) => {
    return path.split('.');
}

const round = (num, places=2) => {
    return parseFloat(Math.round(num * 100) / 100).toFixed(places);
}

export { alphaify, logger, capitalize, p, round };
