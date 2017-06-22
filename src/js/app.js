/*

This is the main entry point for the
application. It takes our top level
component, PageControl, and attaches
it to the div with an id of react-root
on the HTML page, as well as attaching
it to our Redux store.

*/

/* eslint-disable */
if (/bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent)) {
	window.onerror = function (message, url, lineNo, colNo, error) {
    console.log(arguments);

    let container = document.createElement('div');

    container.style.color = 'red';
    container.style.position = 'fixed';
    container.style.background = '#eee';
    container.style.padding = '2em';
    container.style.top = '1em';
    container.style.left = '1em';

    let msg = document.createElement('pre');
    msg.innerText = [
      'Message: ' + message,
      'URL: ' + url,
      'Line: ' + lineNo,
      'Column: ' + colNo,
      'Stack: ' + (error && error.stack)
    ].join('\n');

    container.appendChild(msg);

    document.body.appendChild(container);
  };
}
/* eslint-enable */

import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { PageControl } from './ui';
import { store } from './store';

const Page = connect(state=> state || {})(PageControl);

ReactDOM.render(
  <Page store={store} />,
  document.getElementById('react-root')
);
