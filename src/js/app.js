import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { PageControl } from './ui';
import { store } from './store';


const PageStateManager = connect(
	state => {
		const s = state || {};
		return {
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
