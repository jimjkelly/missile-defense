/*

This provides some general utility functions to the
application

*/

import {rgb} from 'd3-color';
import window from 'global/window';


// Converts hex colors to an SVG friendly format,
// and allows for brightening.
const alphaify = (color, opacity, brighter=0) => {
    var c = rgb(color).brighter(brighter);
    c.opacity = opacity;
    return String(c);
}

// Logging utility function
const logger = (message, object, error = false) => {
    const args = object ? [`${ message }: `, object] : [`${ message }`],
          type = error ? 'error' : 'log';

    if (console) {
        console[type].apply(console, args) // eslint-disable-line no-console
    }
}

// Capitalize a string
const capitalize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Split a dot notated path into an array
const p = (path) => {
    return path.split('.');
}

// Round a value to the number of places given
const round = (num, places=2) => {
    return parseFloat(Math.round(num * 100) / 100).toFixed(places);
}

const urlParams = (() => {
    var match,
        pl = /\+/g,
        search = /([^&=]+)=?([^&]*)/g,
        decode = (s) => decodeURIComponent(s.replace(pl, ' ')),
        query = window.location.search.substring(1),
        urlParams = {};

    while ((match = search.exec(query))) {
        urlParams[decode(match[1])] = decode(match[2]);
    }

    return urlParams;
})(); // IIFE

// This allows other parts of the application to access these functions
export { alphaify, logger, capitalize, p, round, urlParams };
