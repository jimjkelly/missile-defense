/*

This file defines things related to generic UI functionality.
These items are generally fairly dumb to the specifics of
what we're trying to accomplish.

*/

import React from 'react';
import Popover from 'react-popover';
import window from 'global/window';
import { btoa } from 'global';
import { MapControl } from './map';
import { P0 } from './calculations';
import { OffensiveLayer, DefensiveLayer, Target, Probability } from './layers';
import { callAction, reducerMap, store } from './store';
import { p, capitalize } from './utils';
import { fromJS } from 'immutable';


Object.assign(reducerMap, {
    UPDATE_MODEL_TYPE: (state, action) => state.mergeIn(
        p('modelIndex'),
        action.data
    )
});


// This provides a ui widget that allows for editing a text field
class EditableText extends React.Component {
    constructor(props) {
        super(props);
        this.classes = this.props.className ? this.props.className + ' editable-input' : 'editable-input';
        this.validate = this.props.validate ? this.props.validate.bind(this) : null;
        this.editable = props.editable ? props.editable : true;
        this.handleInput = this.handleInput.bind(this);
        this.toggle = this.toggle.bind(this);
        this.state = {
            editing: false,
            valid: true
        }
    }

    componentDidUpdate() {
        if (this.state.editing) {
            this.editInput.focus();
        }
    }

    toggle() {
        this.setState({editing: this.editable && !this.state.editing ? true : false});
    }

    handleInput(e) {
        var valid = this.validate ? this.validate(e.currentTarget) : this.state.valid;

        if (e.key === 'Enter') {
            if (valid) {
                this.props.action(e.currentTarget);
                this.toggle();
            }
        } else if (e.key === 'Escape') {
            this.toggle();
        }

        if (valid !== this.state.valid) {
            this.setState({ valid });
        }
    }

    render() {
        var element, classes = this.state.valid ? this.classes : this.classes + ' invalid';

        if (this.state.editing && this.props.element === 'textarea') {
            element = <textarea
                id={this.props.id}
                onKeyUp={this.handleInput}
                placeholder={this.props.placeholder}
                required={this.props.required}
                defaultValue={this.props.text}
                className={classes}
                ref={node => this.editInput = node}
            />
        } else if (this.state.editing) {
            element = <input
                id={this.props.id}
                onKeyUp={this.handleInput}
                type={this.props.type ? this.props.type : "text"}
                placeholder={this.props.placeholder}
                required={this.props.required}
                defaultValue={this.props.text}
                className={classes}
                ref={node => this.editInput = node}
            />
        } else {
            element = <span id={this.props.id} className={classes} onClick={this.toggle}>
                {this.props.text} { this.editable ? <i className="fa fa-pencil"></i> : null }
            </span>
        }

        return element;

    }
}

class FormInfo extends React.Component {
    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
        this.preferPlace = this.props.preferPlace || "above";
        this.state = {
            show: false
        }
    }

    toggle() {
        this.setState({show: this.state.show ? false : true });
    }

    render() {
        return <Popover body={this.props.children} preferPlace={this.preferPlace} isOpen={this.state.show} onOuterAction={this.toggle}>
                <i className="fa fa-question-circle" onClick={this.toggle}></i>
        </Popover>
    }
}

// Button to Create a Shareable Link to a Calculation
class ShareLink extends React.Component {
    constructor(props) {
        super(props);

        this.link = this.link.bind(this);
        this.toggle = this.toggle.bind(this);

        this.state = {
            show: false
        }
    }

    toggle() {
        this.setState({show: this.state.show ? false : true });
    }

    link() {
        const data = btoa(JSON.stringify(store.getState()));

        return <div>
            {`${window.location.protocol}//${window.location.host}/?link=${data}`}
        </div>
    }

    render() {
        return <div className="share-link">
            <Popover body={this.link()} isOpen={this.state.show} onOuterAction={this.toggle}>
                <i className="fa fa-2x fa-link" onClick={this.toggle}></i>
            </Popover>
        </div>
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


// Select the model type
const ModelSelect = ({ models, selected }) =>
    models.length > 1 ? <div className="model-select">
        <select name="model-select" value={selected} onChange={(e) => callAction('UPDATE_MODEL_TYPE', e.currentTarget.value)}>
            {models.map((model, index) =>
                <option key={index} value={index}>
                    {model.name}
                </option>
            )}
        </select>
        {models[selected].description
            ? <div className="model-description">
                Model Description: {models[selected].description}
            </div>
            : null
        }
    </div>
    : null;


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
const Calculations = ({ layers, target, model }) =>
    <div className="results">
        { !isNaN(model(layers.get('offensive').toJS(), layers.get('defensive').toJS(), target.toJS()))
            ? <Probability a="0" value={model(layers.get('offensive').toJS(), layers.get('defensive').toJS(), target.toJS())} />
            : "P(0): 0.0"
        }
    </div>


// This is the entire application - the map, the layer
// controls, the target information, and the resuting
// calculations.
const PageControl = ({ layers, target, modelIndex }) =>
    <div className="page">
        <MapControl layers={layers} target={target} />
        <div className="data-display">
            <Controls layers={layers} target={target} />
            <div className="bottom-controls">
                <div className="left">
                    <Target target={target} />
                    <ModelSelect models={P0} selected={modelIndex} />
                    <Calculations layers={layers} target={target} model={P0[modelIndex].model} />
                </div>
                <div className="right">
                    <ShareLink />
                </div>
            </div>
        </div>
    </div>


// This allows other parts of the application to access these functions
export { PageControl, EditableText, FormInfo };
