import React from 'react';
import { callAction, reducerMap } from './store';


Object.assign(reducerMap, {
	ADD_LAYER: (state, action) => {
		return Object.assign({}, state, {
			uistate: Object.assign({}, state.uistate, {
				controls: Object.assign({}, state.uistate.controls, {
					[action.data.type]: [
						Object.assign({}, layerDataTemplates[action.data.type]),
						...state.uistate.controls[action.data.type]
					]
				})
			})
		});
	},
	REMOVE_LAYER: (state, action) => {
		return Object.assign({}, state, {
			uistate: Object.assign({}, state.uistate, {
				controls: Object.assign({}, state.uistate.controls, {
					[action.data.type]: state.uistate.controls[action.data.type].filter(
						(e, i) => i !== action.data.index
					)
				})
			})
		});
	}
});


const layerDataTemplates = {
	offensive: {
		name: "New Offensive Layer",
		selected: "notional",
		type: "offensive",
		types: {
			notional: {
				sspk: null,
				reliability: null,
				number: null
			},
			groundburst: {
				yield: null,
				reliability: null,
				cep: null,
				number: null
			}
		}
	}
}


const Layer = ({ index, type, children }) =>
	<div className="layer">
		<i className="layer-button fa fa-minus" onClick={
			e => callAction('REMOVE_LAYER', { index, type })
		}></i>
		{children}
	</div>


const OffensiveLayer = ({ index, type, name, types }) => 
	<Layer index={index} type={type} >
		{name}
	</Layer>

const DefensiveLayer = ({ }) =>
	<Layer>
	</Layer>

export { layerDataTemplates, OffensiveLayer, DefensiveLayer };
