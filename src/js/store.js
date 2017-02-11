/*

This provides functionality related to the Redux
data store.

*/

import { atob } from 'global';
import { createStore } from 'redux';
import { logger, urlParams } from './utils';


// Reducers handle mutating action data into our
// store. Other parts of the application will
// add their own items to this.
var reducerMap = {};


// Actions handle deciding what data needs to be
// sent to a reducer. Other parts of the application
// will add thier own items to this.
var actionMap = {
	FAILURE: (data) => {
		logger('ERROR', data.statusText, true);
		callAction('TOGGLE_MODAL', { status: data.status, statusText: data.statusText, type: 'error' });
	}
};


// The store is the center of truth regarding data
// in the application. The first argument here is
// a function that is called each time we want to
// mutate the state. The second is some initial
// state we use to get the application going.
const store = createStore((state, action) => {
	logger("previous state", state);
	logger("action", action);
	
	const computed_state = reducerMap[action.type] ? reducerMap[action.type](state, action) : state;

	logger("next state", computed_state);

	return computed_state;
}, 'link' in urlParams
	? JSON.parse(atob(urlParams.link))
	: {
		modelIndex: "0",
		target: {
			latitude: 37.7577,
			longitude: -122.4376,
			hardness: 100
		},
		layers: {
			offensive: [],
			defensive: []
		},
		active: {
			offensive: [],
			defensive: []
		}
	}
);


// The callAction function is a utility we can use to
// call the action and reducers in one call
const callAction = (type, data) => {
	var action = actionMap[type] ? actionMap[type](data) : undefined;

	// Note that this case handles the event that either
	// there is no actionMap item for the type, (i.e. the
	// assignment above was undefined) or there was, but it
	// did not return an action.
	if (action == null) {
		action = { type, data };
	}

	store.dispatch(Object.assign({}, action));
};

// This allows other parts of the application to access these functions
export { reducerMap, actionMap, store, callAction };
