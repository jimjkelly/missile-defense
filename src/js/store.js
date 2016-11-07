import _ from 'lodash';
import fetch from 'whatwg-fetch';
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
	uistate: {
		controls: {
			offensive: [],
			defensive: [],
		}
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


const checkStatus = (response) => {
	if (response.status >= 200 && response.status < 300) {
		return response
	} else {
		var error = new Error(response.statusText)
		error.response = response
		throw error
	}
};


const createAsyncActions = ({types, url, actions, reducers, async_function }) => {
	const [ requestType, successType, failureType ] = types;
	const requestAction = actions ? actions[requestType] : undefined,
		  successAction = actions ? actions[successType] : undefined,
		  failureAction = actions ? actions[failureType] : undefined;

	if (async_function === undefined) {
		async_function = ajax;
	}

	actionMap[requestType] = data => requestAction ? requestAction(data) : undefined;
	actionMap[successType] = data => successAction ? successAction(data) : undefined;
	actionMap[failureType] = ({error, data}) => {
		const action = failureAction ? failureAction(error, data) : undefined;

		if (action === undefined) {
			// Default to always log a failure,
			// if nothing else has been done.
			callAction('FAILURE', error);
		}

		return action;
	};

	Object.assign(reducerMap, reducers);

	return payload => {
		callAction(requestType);

		fetch(
			url,
			{
				method: 'post',
	  			body: JSON.stringify(payload),
	  			headers: {
	    			'Accept': 'application/json',
	    			'Content-Type': 'application/json'
	  			}
  			}
		).then(checkStatus)
		.then(response => response.json())
		.then(data => callAction(successType, data))
		.catch(error => callAction(failureType, {error, data: payload}));
	};
};

export { reducerMap, actionMap, store, callAction, createAsyncActions };
