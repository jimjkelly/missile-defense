import React from 'react';
import { MapControl } from './map';
import { P0 } from './calculations';
import { OffensiveLayer, DefensiveLayer, Probability } from './layers';
import { callAction, reducerMap } from './store';
import { capitalize, p } from './utils';
import { fromJS } from 'immutable';


Object.assign(reducerMap, {
    UPDATE_TARGET: (state, action) => {
        return state.mergeIn(
            p(`target`),
            action.data
        );
    }
});


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


const LayerSlider = ({ type, numLayers }) =>
    <div className="layer-slider">
        {`${numLayers} ${capitalize(type)} ${numLayers === 1 ? "Layer" : "Layers"}`}
        <LayerButton type={type} action="ADD">
            <i className="fa fa-plus"></i>
        </LayerButton>
    </div>


const LayerControl = ({ type, layers, Layer, target }) =>
    <div className={`layer-control ${type}`}>
        <LayerSlider type={type} numLayers={layers.size} />
        {layers.map((layer, index) =>
            <Layer key={index} index={index} type={type} layerData={layer} target={target} />
        )}
    </div>


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


const Target = ({ target }) =>
    <div className="target">
        <label>Target Information:</label>
        <div>
            Latitude: <EditableText
                text={target.get('latitude')}
                action={(element) => callAction(
                    'UPDATE_TARGET',
                    { latitude: element.value }
                )}
            />
        </div>
        <div>
            Longitude: <EditableText
                text={target.get('longitude')}
                action={(element) => callAction(
                    'UPDATE_TARGET',
                    { longitude: element.value }
                )}
            />
        </div>
        <div>
            Radius: <EditableText
                text={target.get('radius')}
                action={(element) => callAction(
                    'UPDATE_TARGET',
                    { radius: element.value }
                )}
            />
        </div>
        <div>
            Hardness: <EditableText
                text={target.get('hardness')}
                action={(element) => callAction(
                    'UPDATE_TARGET',
                    { hardness: element.value }
                )}
            />
        </div>
    </div>


const Calculations = ({ layers, target }) =>
    <div className="results">
        { !isNaN(P0(layers.get('offensive').toJS(), layers.get('defensive').toJS(), target.toJS()))
            ? <Probability a="0" value={P0(layers.get('offensive').toJS(), layers.get('defensive').toJS(), target.toJS())} />
            : "P(0): 0.0"
        }
    </div>


const PageControl = ({ layers, target }) =>
    <div className="page">
        <MapControl layers={layers} target={target} />
        <div className="data-display">
            <Controls layers={layers} target={target} />
            <Target target={target} />
            <Calculations layers={layers} target={target} />
        </div>
    </div>


export { PageControl, EditableText };
