/*

This file defines things related to generic UI functionality.
These items are generally fairly dumb to the specifics of
what we're trying to accomplish.

*/

import React from 'react';
import Popover from 'react-popover';
import window from 'global/window';
import { btoa } from 'global';
import { MapControl, colors } from './map';
import { P0 } from './calculations';
import { OffensiveLayer, DefensiveLayer, Target, Probability } from './layers';
import { VictoryArea, VictoryChart, VictoryTheme, VictoryLabel } from 'victory';
import { callAction, reducerMap, store } from './store';
import { capitalize } from './utils';


Object.assign(reducerMap, {
    UPDATE_MODEL_TYPE: (state, action) => Object.assign({}, state, {
        modelIndex: action.data
    })
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
const LayerButton = ({ type, children, data }) =>
    <div className="layer-button" onClick={() =>
        callAction(
            `ADD_LAYER`,
            {
                type: type,
                name: `New ${type} layer`,
                ...data
            }
        )}
    >
        {children}
    </div>


// Layer control with count of layers and button to add
const LayerSlider = ({ type, numLayers, data }) =>
    <div className="layer-slider">
        {`${numLayers} ${capitalize(type)} ${numLayers === 1 ? "Layer" : "Layers"}`}
        <LayerButton type={type} data={data}>
            <i className="fa fa-plus"></i>
        </LayerButton>
    </div>


// Control to add layers as well as the layers themselves
const LayerControl = ({ type, layers, Layer, target }) =>
    <div className={`layer-control ${type}`}>
        <LayerSlider type={type} numLayers={layers.filter(e => e.type === type).length} data={{ latitude: target.latitude, longitude: target.longitude }} />
        {layers.map((layer, index) =>
            layer.type === type
                ? <Layer key={index} index={index} type={type} layerData={layer} target={target} />
                : null
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
            layers={layers}
            target={target}
        />
        <LayerControl
            type="defensive"
            Layer={DefensiveLayer}
            layers={layers}
            target={target}
        />
    </div>


// Shows the resulting P(0)
const Calculations = ({ layers, target, model }) =>
    <div className="results">
        { !isNaN(model(layers.filter(e => e.type === 'offensive'), layers.filter(e => e.type === 'defensive'), target))
            ? <Probability a="0" value={model(layers.filter(e => e.type === 'offensive'), layers.filter(e => e.type === 'defensive'), target)} />
            : "P(0): 0.0"
        }
    </div>


// Chart the P(0) over W
const ProbabilityChart = ({ p0, maxWarheads }) =>
    <VictoryChart theme={Object.assign({}, VictoryTheme.material, {
        area: Object.assign({}, VictoryTheme.material.area, {
            style: {
                data: {
                    fill: colors.defensive
                }
            }
        })
    })}>
        { p0 > 0 ? <VictoryArea
            data={[...Array(maxWarheads + 1).keys()].map((_, i) => ({x:i, y: 1}))}
            x="x"
            y="y"
            style={{
                data: {
                    fill: colors.offensive
                }
            }}
        /> : null }
        <VictoryArea
            data={[...Array(maxWarheads + 1).keys()].map((_, i) => ({
                'x': i,
                'y': p0 ? Math.pow(p0, i) : 1
            }))}
            x="x"
            y="y"
        />
        <VictoryLabel transform="translate(115, 340)" text="Number of Warheads" />
        <VictoryLabel transform="rotate(-90, 120, 110)" text="Probability of No Strikes" />
    </VictoryChart>

// This is the entire application - the map, the layer
// controls, the target information, and the resuting
// calculations.
const PageControl = ({ map, layers, active, target, modelIndex }) =>
    <div className="page">
        <MapControl map={map} layers={layers} target={target} modelIndex={modelIndex} />
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
            {active.length
                ? <ProbabilityChart
                    p0={P0[modelIndex].model(
                        layers.filter((e, i) => active.includes(i)).filter((e) => e.type === 'offensive'),
                        layers.filter((e, i) => active.includes(i)).filter((e) => e.type === 'defensive'),
                        target
                    )}
                    maxWarheads={20}
                />
                : null
            }
        </div>
    </div>

// This allows other parts of the application to access these functions
export { PageControl, EditableText, FormInfo };
