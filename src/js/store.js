import { fromJS } from 'immutable';
import { createStore } from 'redux';
import { logger } from './utils';


var reducerMap = {};


var actionMap = {
	FAILURE: (data) => {
		logger('ERROR', data.statusText, true);
		callAction('TOGGLE_MODAL', { status: data.status, statusText: data.statusText, type: 'error' });
	}
};


const store = createStore((state, action) => {
	logger("previous state", state.toJS());
	logger("action", action);
	
	const computed_state = reducerMap[action.type] ? reducerMap[action.type](state, action) : state;

	logger("next state", computed_state.toJS());

	return computed_state;
}, fromJS({
	target: {
		latitude: 37.7577,
        longitude: -122.4376,
		radius: 5,
		hardness: 0
	},
	layers: {
		offensive: [],
		defensive: []
	}
}));


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


export { reducerMap, actionMap, store, callAction };
