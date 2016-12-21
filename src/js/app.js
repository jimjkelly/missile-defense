/*

This is the main entry point for the
application. It takes our top level
component, PageControl, and attaches
it to the div with an id of react-root
on the HTML page, as well as attaching
it to our Redux store.

*/

import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { PageControl } from './ui';
import { store } from './store';


const PageStateManager = connect(
	state => {
		const s = state || {};
		return {
            modelIndex: s.get('modelIndex'),
			layers: s.get('layers'),
            target: s.get('target')
		};
	}
);

const Page = PageStateManager(PageControl);

ReactDOM.render(
	<Page store={store} />,
	document.getElementById('react-root')
);
