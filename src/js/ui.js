import React from 'react';
import { findDOMNode } from 'react-dom';
import { OffensiveLayer, DefensiveLayer } from './layers';
import { Calculations } from './calculations';
import { callAction } from './store';
import { capitalize } from './utils';
import { MapControl } from './map';
import { fromJS } from 'immutable';


class EditableText extends React.Component {
	constructor(props) {
		super(props);
		this.classes = this.props.className ? this.props.className + ' editable-input' : 'editable-input';
		this.editable = props.editable ? props.editable : true;
		this.handleInput = this.handleInput.bind(this);
		this.toggle = this.toggle.bind(this);
		this.state = {
			editing: false
		}
	}

	componentDidUpdate() {
		if (this.state.editing) {
			findDOMNode(this.refs.editInput).focus();
		}
	}

	toggle() {
		this.setState({editing: this.editable && !this.state.editing ? true : false});
	}

	handleInput(e) {
		if (e.key === 'Enter') {
			this.props.action(e.currentTarget);
			this.toggle();
		} else if (e.key === 'Escape') {
			this.toggle();
		}
	}

	render() {
		var element;

		if (this.state.editing && this.props.element === 'textarea') {
			element = <textarea
				id={this.props.id}
				onKeyUp={this.handleInput}
				placeholder={this.props.placeholder}
				required={this.props.required}
				defaultValue={this.props.text}
				className={this.classes}
				ref="editInput"
			/>
		} else if (this.state.editing) {
			element = <input
				id={this.props.id}
				onKeyUp={this.handleInput}
				type={this.props.type ? this.props.type : "text"}
				placeholder={this.props.placeholder}
				required={this.props.required}
				defaultValue={this.props.text}
				className={this.classes}
				ref="editInput"
			/>
		} else {
			element = <span id={this.props.id} className={this.classes} onClick={this.toggle}>
				{this.props.text} { this.editable ? <i className="fa fa-pencil"></i> : null }
			</span>
		}

		return element;

	}
};


const LayerButton = ({ type, action, children }) =>
	<div className="layer-button" onClick={e =>
		callAction(
			`${action}_LAYER`,
			{
				type: type,
				layer: fromJS({
					name: `New ${type} layer`
				})
			}
		)}
	>
		{children}
	</div>


const LayerSlider = ({ type, numLayers }) =>
	<div className="layer-slider">
		{`${numLayers} ${capitalize(type)} ${numLayers === 1 ? "Layer" : "Layers"}`}
		<LayerButton type={type} action="ADD">
			<i className="fa fa-plus"></i>
		</LayerButton>
	</div>

const LayerControl = ({ type, layers, Layer }) =>
	<div className={`layer-control ${type}`}>
		<LayerSlider type={type} numLayers={layers.size} />
		{layers.map((layer, index) =>
			<Layer key={index} index={index} type={type} layerData={layer} />
		)}
	</div>

const Controls = ({ controls }) =>
	<div className="controls">
		<div className="layers">
			<LayerControl
				type="offensive"
				Layer={OffensiveLayer}
				layers={controls.get('offensive')}
			/>
			<LayerControl
				type="defensive"
				Layer={DefensiveLayer}
				layers={controls.get('defensive')}
			/>
		</div>
		<Calculations controls={controls} />
	</div>

const PageControl = ({ uistate }) =>
	<div className="page">
		<MapControl />
		<Controls controls={uistate.get('controls')} />
	</div>


export { PageControl, EditableText };
