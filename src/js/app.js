import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { PageControl } from './ui';
import { store } from './store';


const PageStateManager = connect(
	state => {
		const s = state || {};
		return {
			uistate: s.uistate
		};
	}
);

const Page = PageStateManager(PageControl);

ReactDOM.render(
	<Page store={store} />,
	document.getElementById('react-root')
);
