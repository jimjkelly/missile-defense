import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { MapControl } from './map';
import { store } from './store';


const PageStateManager = connect(
	state => {
		const s = state || {};
		return {

		};
	}
);

const PageControl = () => {
	return <MapControl />
};

const Page = PageStateManager(PageControl);

ReactDOM.render(
	<Page store={store} />,
	document.getElementById('react-root')
);
