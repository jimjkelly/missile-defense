/*

This file defines things related to generic UI functionality.
These items are generally fairly dumb to the specifics of
what we're trying to accomplish.

*/

import React from 'react';
import { MapControl } from './map';
import { P0 } from './calculations';
import { OffensiveLayer, DefensiveLayer, Target, Probability } from './layers';
import { callAction } from './store';
import { capitalize } from './utils';
import { fromJS } from 'immutable';


// This provides a ui widget that allows for editing a text field
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
}

// This is the button a user clicks to add a new layer
const LayerButton = ({ type, action, children }) =>
    <div className="layer-button" onClick={() =>
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


// Layer control with count of layers and button to add
const LayerSlider = ({ type, numLayers }) =>
    <div className="layer-slider">
        {`${numLayers} ${capitalize(type)} ${numLayers === 1 ? "Layer" : "Layers"}`}
        <LayerButton type={type} action="ADD">
            <i className="fa fa-plus"></i>
        </LayerButton>
    </div>


// Control to add layers as well as the layers themselves
const LayerControl = ({ type, layers, Layer, target }) =>
    <div className={`layer-control ${type}`}>
        <LayerSlider type={type} numLayers={layers.size} />
        {layers.map((layer, index) =>
            <Layer key={index} index={index} type={type} layerData={layer} target={target} />
        )}
    </div>


// Has the two types of layer controls
const Controls = ({ layers, target }) =>
    <div className="layers">
        <LayerControl
            type="offensive"
            Layer={OffensiveLayer}
            layers={layers.get('offensive')}
            target={target}
        />
        <LayerControl
            type="defensive"
            Layer={DefensiveLayer}
            layers={layers.get('defensive')}
        />
    </div>


// Shows the resulting P(0)
const Calculations = ({ layers, target }) =>
    <div className="results">
        { !isNaN(P0(layers.get('offensive').toJS(), layers.get('defensive').toJS(), target.toJS()))
            ? <Probability a="0" value={P0(layers.get('offensive').toJS(), layers.get('defensive').toJS(), target.toJS())} />
            : "P(0): 0.0"
        }
    </div>


// This is the entire application - the map, the layer
// controls, the target information, and the resuting
// calculations.
const PageControl = ({ layers, target }) =>
    <div className="page">
        <MapControl layers={layers} target={target} />
        <div className="data-display">
            <Controls layers={layers} target={target} />
            <Target target={target} />
            <Calculations layers={layers} target={target} />
        </div>
    </div>


// This allows other parts of the application to access these functions
export { PageControl, EditableText };
